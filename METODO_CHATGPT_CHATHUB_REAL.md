# Método Real de ChatHub para ChatGPT

## Resumen

ChatHub **NO hace peticiones HTTP directas** al backend de ChatGPT desde la extensión. En su lugar, usa un **WebSocket** o **EventStream** conectado a través del iframe de ChatGPT.

## Por Qué No Ves Peticiones en Network

Si miras las peticiones del Service Worker de ChatHub y no ves llamadas a `backend-api/conversation`, es porque:

1. **ChatHub abre un iframe** de ChatGPT (o redirige a la webapp)
2. **Las peticiones las hace el iframe**, no la extensión directamente
3. **Usa EventSource / WebSocket** para recibir respuestas streaming
4. **Content Scripts** capturan la respuesta del DOM

## Arquitectura Real de ChatHub

### Método 1: WebApp Mode (Recomendado)

```
Usuario escribe prompt
    ↓
Background Script
    ↓
Abre pestaña de chatgpt.com
    ↓
Content Script inyectado en chatgpt.com
    ↓
Inserta prompt en textarea
    ↓
Simula click en botón enviar
    ↓
ChatGPT procesa normalmente
    ↓
Content Script lee respuesta del DOM
    ↓
Envía respuesta al Background
    ↓
Background envía a UI
```

Este es el método que recomienda ChatHub y el que usa por defecto.

### Método 2: API Directa (Requiere AccessToken)

Para poder hacer peticiones directas al backend de ChatGPT desde la extensión, ChatHub usa:

```javascript
// Clase base en ChatHub para ChatGPT
class ChatGPTBot extends Bot {
    constructor(model, historyDisabled) {
        this.model = model;
        this.historyDisabled = historyDisabled;
        this.context = {};
    }

    async doSendMessage(params) {
        // Obtener access token
        this.accessToken = await getAccessToken();

        // Hacer petición
        const response = await this.postMessage(params);

        // Procesar streaming response
        await processStreamingResponse(response, params.onEvent);
    }

    async getAccessToken() {
        try {
            const session = await fetch('https://chatgpt.com/api/auth/session');
            const data = await session.json();

            if (data.error === 'RefreshAccessTokenError') {
                throw new Error('Please login to ChatGPT');
            }

            return data.accessToken;
        } catch (error) {
            throw error;
        }
    }

    buildMessage(prompt, imageData) {
        return {
            id: generateUUID(),
            author: { role: 'user' },
            content: imageData
                ? {
                    content_type: 'multimodal_text',
                    parts: [imageData, prompt]
                  }
                : {
                    content_type: 'text',
                    parts: [prompt]
                  }
        };
    }

    async postMessage(params) {
        // Obtener requisitos de chat
        const requirements = await fetch(
            'https://chatgpt.com/backend-api/sentinel/chat-requirements',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p: await generateProofToken()
                })
            }
        );

        const reqData = await requirements.json();

        // Calcular proof of work
        const proofToken = await calculateProofOfWork(
            reqData.proofofwork.seed,
            reqData.proofofwork.difficulty
        );

        // Enviar mensaje
        const url = this.accessToken
            ? 'https://chatgpt.com/backend-api/conversation'
            : 'https://chatgpt.com/backend-anon/conversation';

        return fetch(url, {
            method: 'POST',
            signal: params.signal,
            headers: {
                'accept': 'text/event-stream',
                'Content-Type': 'application/json',
                'Oai-Device-Id': getDeviceId(),
                'Oai-Language': 'en-US',
                'Openai-Sentinel-Chat-Requirements-Token': reqData.token,
                'Openai-Sentinel-Proof-Token': proofToken,
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: JSON.stringify({
                action: 'next',
                conversation_mode: { kind: 'primary_assistant' },
                force_nulligen: false,
                force_paragen: false,
                force_paragen_model_slug: '',
                force_rate_limit: false,
                force_use_sse: true,
                history_and_training_disabled: this.historyDisabled,
                messages: [this.buildMessage(params.prompt, params.imageData)],
                model: this.model,
                parent_message_id: this.context.lastMessageId || generateUUID(),
                conversation_id: this.context.conversationId || undefined,
                suggestions: []
            })
        });
    }
}
```

## Device ID Persistente

```javascript
function getDeviceId() {
    let deviceId = localStorage.getItem('oai_device_id');
    if (!deviceId) {
        deviceId = generateUUID();
        localStorage.getItem('oai_device_id', deviceId);
    }
    return deviceId;
}
```

## Proof of Work

ChatHub usa un **Web Worker** para calcular el proof-of-work sin bloquear la UI:

```javascript
// worker-DrXR2XoY.js (simplificado)
self.onmessage = async function(e) {
    const { seed, difficulty, config } = e.data;

    // Configuración del navegador
    const browserConfig = [
        navigator.hardwareConcurrency + screen.width + screen.height,
        new Date().toString(),
        performance.memory?.jsHeapSizeLimit || 0,
        0,
        navigator.userAgent,
        '', '',
        navigator.language,
        navigator.languages.join(','),
        0
    ];

    // Calcular hash (simplificado - algoritmo real es más complejo)
    const result = await calculateHash(seed, difficulty, browserConfig);

    self.postMessage(result);
};
```

Uso del Worker:

```javascript
const worker = new Worker('worker-DrXR2XoY.js');

function calculateProofOfWork(seed, difficulty) {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(e);
        worker.postMessage({ seed, difficulty, config: getBrowserConfig() });
    });
}
```

## Headers Completos para ChatGPT API

```javascript
{
    'accept': 'text/event-stream',
    'Content-Type': 'application/json',
    'Oai-Device-Id': 'uuid-persistente',           // Generado y guardado
    'Oai-Language': 'en-US',
    'Openai-Sentinel-Chat-Requirements-Token': '...', // Del /sentinel/chat-requirements
    'Openai-Sentinel-Proof-Token': 'gAAAAAB...',     // Calculado con Worker
    'Authorization': 'Bearer <accessToken>'          // Del /api/auth/session
}
```

## Por Qué es Difícil Replicar

1. **Proof-of-Work complejo**: Requiere un algoritmo específico que OpenAI puede cambiar
2. **Anti-bot detection**: OpenAI detecta patrones no humanos
3. **Rate limiting**: Limita peticiones desde extensiones
4. **Cloudflare**: Puede bloquear peticiones sospechosas

## Solución Recomendada por ChatHub

ChatHub **NO recomienda** usar la API directa para usuarios finales. En su lugar:

### Para Extensiones:
- Usa **WebApp Mode**: Abre chatgpt.com y automatiza con Content Scripts
- Usa **Official API** si tienes API key

### Para Desarrollo:
- Usa la **Official OpenAI API** con `OPENAI_API_KEY`
- Es más estable, documentada y permitida

## Código de Referencia (ChatHub)

El código real de ChatHub está en:
- `3.99.4_0/assets/premium-CHh0JHCP.js` (minificado)
- Clase: `_0t` (nombre minificado)
- Usa librería: `rrweb` para recording/replay

## Diferencia con Gemini

| Aspecto | Gemini | ChatGPT |
|---------|--------|---------|
| Método | GET HTML → extraer tokens → POST directo | GET session → Proof-of-Work → POST con tokens |
| Complejidad | Baja (solo regex) | Alta (worker, hashing, tokens) |
| Estabilidad | Alta (tokens en HTML) | Baja (OpenAI lo cambia seguido) |
| Bloqueos | Raro | Frecuente (anti-bot) |

## Implementación Recomendada

Para tu extensión, te recomiendo:

### Opción 1: WebApp Mode (Más Fácil)
```javascript
async function sendToChatGPT(prompt) {
    // 1. Abrir pestaña de ChatGPT
    const tab = await chrome.tabs.create({
        url: 'https://chatgpt.com',
        active: false
    });

    // 2. Esperar que cargue
    await waitForLoad(tab.id);

    // 3. Inyectar content script
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (prompt) => {
            // Insertar prompt
            const textarea = document.querySelector('textarea');
            textarea.value = prompt;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            // Enviar
            const sendButton = document.querySelector('button[data-testid="send-button"]');
            sendButton.click();

            // Esperar respuesta
            await waitForResponse();

            // Retornar respuesta
            return extractResponse();
        },
        args: [prompt]
    });
}
```

### Opción 2: Official API (Más Confiable)
```javascript
async function sendToChatGPT(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            stream: true
        })
    });

    // Procesar streaming
    const reader = response.body.getReader();
    // ...
}
```

## Conclusión

ChatHub **usa principalmente WebApp Mode** para ChatGPT porque:
- ✅ Es más confiable
- ✅ No requiere proof-of-work
- ✅ No se bloquea por anti-bot
- ✅ Usa la sesión del usuario automáticamente

El método de API directa con proof-of-work **existe** pero es:
- ❌ Complejo de implementar
- ❌ Inestable (OpenAI lo cambia)
- ❌ Bloqueado frecuentemente
- ❌ Requiere mantenimiento constante

**Recomendación**: Usa WebApp Mode o la Official API en lugar de intentar replicar el método de proof-of-work.
