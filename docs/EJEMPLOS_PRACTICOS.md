# 🎯 Ejemplos Prácticos: Desglose Técnico Paso a Paso

## 📋 Índice
1. [Ejemplo Completo: ChatGPT Webapp](#ejemplo-completo-chatgpt-webapp)
2. [Ejemplo Completo: Mistral API](#ejemplo-completo-mistral-api)
3. [Debugging en Tiempo Real](#debugging-en-tiempo-real)
4. [Ejercicios Prácticos](#ejercicios-prácticos)

---

## 1. Ejemplo Completo: ChatGPT Webapp

### Paso 1: Entender la Comunicación Normal

Cuando usas ChatGPT normalmente:

```
Tu Navegador (chrome)
    ↓
[Escribes en chatgpt.com]
    ↓
JavaScript de ChatGPT hace:
    ↓
fetch('https://chatgpt.com/backend-api/conversation', {
    credentials: 'include',  // Envía cookies automáticamente
    headers: {
        'Authorization': 'Bearer ' + tuTokenDeAcceso,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: "Hola",
        model: "gpt-4"
    })
})
    ↓
Servidor ChatGPT verifica:
    ✓ Cookie válida (sesión activa)
    ✓ Token de autorización correcto
    ✓ Origin: chatgpt.com (viene de su propia web)
    ↓
Responde con streaming
```

### Paso 2: Replicar desde Nuestra Extensión

**Archivo: `background_streaming.js` línea ~800**

```javascript
async function sendToChatGPTDirect(prompt) {
    console.log('[ChatGPT] Iniciando envío...');

    // 1️⃣ ENCONTRAR LA TAB DE CHATGPT
    // Necesitamos inyectar código en una tab real de chatgpt.com
    const tabs = await chrome.tabs.query({ url: 'https://chatgpt.com/*' });

    if (tabs.length === 0) {
        throw new Error('No hay tab de ChatGPT abierta');
    }

    const chatgptTab = tabs[0];
    console.log(`[ChatGPT] Tab encontrada: ${chatgptTab.id}`);

    // 2️⃣ INYECTAR CÓDIGO EN LA TAB
    // Este código correrá DENTRO de chatgpt.com
    // Por lo tanto, tendrá acceso a las cookies de sesión
    const result = await chrome.scripting.executeScript({
        target: { tabId: chatgptTab.id },

        // Esta función se ejecuta en el contexto de chatgpt.com
        func: async (userPrompt) => {

            // 3️⃣ OBTENER TOKEN DE ACCESO
            // ChatGPT guarda el token en el sessionStorage
            let accessToken;
            try {
                const sessionResponse = await fetch('https://chatgpt.com/api/auth/session');
                const sessionData = await sessionResponse.json();
                accessToken = sessionData.accessToken;
            } catch (error) {
                console.error('Error obteniendo token:', error);
                throw new Error('No se pudo obtener el token de acceso');
            }

            // 4️⃣ HACER LA PETICIÓN AL BACKEND
            const response = await fetch('https://chatgpt.com/backend-api/conversation', {
                method: 'POST',

                credentials: 'include',  // 🔑 CRÍTICO: Incluye cookies automáticamente

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`  // Token obtenido arriba
                },

                body: JSON.stringify({
                    action: 'next',
                    messages: [{
                        id: crypto.randomUUID(),
                        role: 'user',
                        content: {
                            content_type: 'text',
                            parts: [userPrompt]
                        }
                    }],
                    model: 'gpt-4',
                    parent_message_id: crypto.randomUUID()
                })
            });

            // 5️⃣ LEER RESPUESTA STREAMING
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Obtener el reader del stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Leer chunk por chunk
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('[ChatGPT] Stream finalizado');
                    break;
                }

                // Decodificar el chunk
                const chunk = decoder.decode(value, { stream: true });

                // El formato es:
                // data: {"message": {"content": {"parts": ["texto aquí"]}}}
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);

                        if (jsonStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(jsonStr);
                            const text = data.message?.content?.parts?.[0] || '';

                            // 6️⃣ ENVIAR A BACKGROUND SCRIPT
                            // Comunicación: content script → background
                            chrome.runtime.sendMessage({
                                type: 'STREAMING_UPDATE',
                                ai: 'chatgpt',
                                response: text,
                                isComplete: false
                            });

                        } catch (e) {
                            // Ignorar errores de parsing
                        }
                    }
                }
            }

            // 7️⃣ NOTIFICAR QUE TERMINÓ
            chrome.runtime.sendMessage({
                type: 'STREAMING_UPDATE',
                ai: 'chatgpt',
                response: '',  // Ya se envió todo
                isComplete: true
            });
        },

        args: [prompt]  // Pasar el prompt como argumento
    });

    console.log('[ChatGPT] ✓ Inyección exitosa');
}
```

### Paso 3: ¿Por Qué Funciona?

**Diagrama de Contexto:**

```
┌─────────────────────────────────────────────────┐
│  ORIGEN: chrome-extension://xyz123              │
│  background_streaming.js                        │
│                                                 │
│  ❌ Si hacemos fetch aquí:                     │
│     fetch('chatgpt.com/api')                   │
│     → CORS Error                               │
│     → No tiene cookies de sesión               │
└─────────────────────────────────────────────────┘
                        │
                        │ chrome.scripting.executeScript()
                        ↓
┌─────────────────────────────────────────────────┐
│  ORIGEN: https://chatgpt.com                    │
│  Content Script Inyectado                       │
│                                                 │
│  ✅ Si hacemos fetch aquí:                     │
│     fetch('/backend-api/conversation')         │
│     → Mismo origen, no hay CORS                │
│     → Cookies se envían automáticamente        │
│     → Servidor cree que es su propia web       │
└─────────────────────────────────────────────────┘
```

**Elementos clave:**

1. **Same-Origin**: El código corre en `chatgpt.com`, no en `chrome-extension://`
2. **Cookies**: Se envían automáticamente porque es el mismo dominio
3. **Token**: Lo obtenemos del `/api/auth/session` endpoint
4. **Servidor engañado**: Ve una petición legítima de su propia web

---

## 2. Ejemplo Completo: Mistral API

### Paso 1: API Directa (Sin Spoofing)

Mistral tiene una API oficial documentada:

**Archivo: `background_streaming.js` línea ~1540**

```javascript
async function sendToMistralDirect(prompt) {
    console.log('[Mistral] Enviando prompt...');

    // 1️⃣ OBTENER API KEY
    // Guardada por el usuario en chrome.storage.local
    const apiKey = await getMistralApiKey();

    if (!apiKey) {
        throw new Error('Mistral API key no configurada');
    }

    // 2️⃣ MANTENER CONTEXTO DE CONVERSACIÓN
    // Mistral requiere historial completo de mensajes
    mistralConversationContext.messages.push({
        role: 'user',
        content: prompt
    });

    // 3️⃣ HACER PETICIÓN DIRECTA
    // No necesitamos inyectar en ninguna tab
    // Es una API pública
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',

        headers: {
            'Authorization': `Bearer ${apiKey}`,  // 🔑 Autenticación con API key
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            model: 'mistral-large-latest',

            // Enviar TODO el historial (no solo el último mensaje)
            messages: mistralConversationContext.messages,

            stream: true,  // 🌊 Activar streaming

            temperature: 0.7,  // Creatividad
            max_tokens: 4096   // Máxima longitud de respuesta
        })
    });

    // 4️⃣ VERIFICAR RESPUESTA
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mistral API error ${response.status}: ${error}`);
    }

    // 5️⃣ LEER STREAMING (Formato OpenAI)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decodificar chunk
        const chunk = decoder.decode(value, { stream: true });

        // Formato:
        // data: {"choices":[{"delta":{"content":"Hola"}}]}
        // data: {"choices":[{"delta":{"content":" mundo"}}]}
        // data: [DONE]

        const lines = chunk.split('\n');

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.substring(6).trim();

            if (jsonStr === '[DONE]') continue;

            try {
                const data = JSON.parse(jsonStr);

                // Extraer el contenido del delta
                const content = data.choices?.[0]?.delta?.content;

                if (content) {
                    fullText += content;

                    // 6️⃣ ACTUALIZAR UI EN TIEMPO REAL
                    chrome.runtime.sendMessage({
                        type: 'STREAMING_UPDATE',
                        ai: 'mistral',
                        response: fullText,
                        isComplete: false
                    }).catch(() => {});  // Ignorar si popup está cerrado
                }

            } catch (e) {
                console.error('[Mistral] Error parsing JSON:', e);
            }
        }
    }

    // 7️⃣ GUARDAR RESPUESTA EN CONTEXTO
    mistralConversationContext.messages.push({
        role: 'assistant',
        content: fullText
    });

    // 8️⃣ NOTIFICAR FIN
    chrome.runtime.sendMessage({
        type: 'STREAMING_UPDATE',
        ai: 'mistral',
        response: fullText,
        isComplete: true
    }).catch(() => {});

    console.log('[Mistral] ✓ Respuesta completa');
    return fullText;
}

// Función auxiliar
async function getMistralApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['mistralApiKey'], (result) => {
            if (!result.mistralApiKey) {
                reject(new Error('Mistral API key not configured'));
                return;
            }
            resolve(result.mistralApiKey);
        });
    });
}
```

### Paso 2: Diferencias con ChatGPT

**Tabla comparativa:**

| Aspecto | ChatGPT (Webapp) | Mistral (API) |
|---------|------------------|---------------|
| **Autenticación** | Cookies + Token de sesión | API Key en header |
| **Endpoint** | Interno: `/backend-api/conversation` | Público: `/v1/chat/completions` |
| **Origen** | Debe inyectarse en chatgpt.com | Directo desde background |
| **Documentación** | No oficial (ingeniería inversa) | Oficial: docs.mistral.ai |
| **Rate Limits** | Basado en plan de usuario | 5 req/s gratis, más con pago |
| **Estabilidad** | Puede romper si cambian UI | Estable (API versionada) |
| **Contexto** | Lo maneja el servidor | Debemos enviarlo nosotros |

### Paso 3: Formato de Mensajes

**ChatGPT:**
```json
{
  "action": "next",
  "messages": [
    {
      "id": "uuid-here",
      "role": "user",
      "content": {
        "content_type": "text",
        "parts": ["Mi pregunta"]
      }
    }
  ],
  "model": "gpt-4",
  "parent_message_id": "uuid-anterior"
}
```

**Mistral (OpenAI-compatible):**
```json
{
  "model": "mistral-large-latest",
  "messages": [
    {"role": "system", "content": "Eres un asistente útil"},
    {"role": "user", "content": "Mi pregunta"},
    {"role": "assistant", "content": "Respuesta anterior"},
    {"role": "user", "content": "Siguiente pregunta"}
  ],
  "stream": true
}
```

---

## 3. Debugging en Tiempo Real

### Herramienta 1: Chrome DevTools

**Paso a paso para analizar ChatGPT:**

1. **Abrir ChatGPT:**
   - Ve a https://chatgpt.com
   - Loguéate

2. **Abrir DevTools:**
   - Presiona F12
   - Ve a la pestaña "Network"
   - Activa filtro "Fetch/XHR"

3. **Enviar mensaje:**
   - Escribe "hola" en ChatGPT
   - Presiona Enter

4. **Analizar petición:**
   - Busca `/backend-api/conversation`
   - Click en la petición

5. **Ver detalles:**

```
General:
  Request URL: https://chatgpt.com/backend-api/conversation
  Request Method: POST
  Status Code: 200 OK

Request Headers:
  authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNM...
  content-type: application/json
  cookie: __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...; ...
  origin: https://chatgpt.com
  referer: https://chatgpt.com/

Request Payload:
  {
    "action": "next",
    "messages": [{
      "id": "aaa2f7d1-1234-4567-8901-abcdef123456",
      "role": "user",
      "content": {
        "content_type": "text",
        "parts": ["hola"]
      }
    }],
    "model": "gpt-4o",
    "parent_message_id": "aaa2f7d1-0000-0000-0000-000000000000"
  }

Response (streaming):
  data: {"message":{"id":"msg_123","content":{"parts":["¡Hola!"]}}}

  data: {"message":{"id":"msg_123","content":{"parts":["¡Hola! ¿En qué"]}}}

  data: {"message":{"id":"msg_123","content":{"parts":["¡Hola! ¿En qué puedo ayudarte"]}}}

  data: [DONE]
```

6. **Copiar como código:**
   - Click derecho → "Copy" → "Copy as fetch"
   - Pega en la consola para replicarlo

### Herramienta 2: Extension Console

**Ver logs de background script:**

1. **Abrir extensiones:**
   - chrome://extensions/

2. **Activar modo desarrollador:**
   - Toggle arriba a la derecha

3. **Inspect service worker:**
   - Click en "service worker" debajo de tu extensión

4. **Ver logs:**
```
[ChatGPT] Iniciando envío...
[ChatGPT] Tab encontrada: 123
[ChatGPT] ✓ Inyección exitosa
[ChatGPT] Token obtenido: eyJhbGci...
[ChatGPT] Haciendo petición...
[ChatGPT] Stream iniciado
[ChatGPT] Chunk recibido: "Hola"
[ChatGPT] Chunk recibido: "Hola, ¿cómo"
[ChatGPT] Stream finalizado
```

### Herramienta 3: Network Monitor Custom

**Agregar logs detallados:**

```javascript
// En background_streaming.js

// Wrapper para fetch que loggea todo
async function fetchWithLogging(url, options) {
    console.log(`[Fetch] → ${url}`);
    console.log('[Fetch] Headers:', options.headers);
    console.log('[Fetch] Body:', options.body);

    const startTime = Date.now();

    try {
        const response = await fetch(url, options);

        const duration = Date.now() - startTime;
        console.log(`[Fetch] ← ${response.status} (${duration}ms)`);

        return response;
    } catch (error) {
        console.error(`[Fetch] ✗ Error:`, error);
        throw error;
    }
}

// Usar en lugar de fetch()
const response = await fetchWithLogging('https://api.mistral.ai/...', {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({ ... })
});
```

---

## 4. Ejercicios Prácticos

### Ejercicio 1: Analizar Otra IA

**Objetivo:** Descubrir cómo funciona Claude.ai

**Pasos:**
1. Abre https://claude.ai
2. Loguéate
3. F12 → Network → Fetch/XHR
4. Envía un mensaje
5. Encuentra la petición al backend
6. Responde:
   - ¿Cuál es la URL del endpoint?
   - ¿Qué headers usa?
   - ¿Qué formato tiene el body?
   - ¿Usa streaming?

**Solución esperada:**
```
Endpoint: https://claude.ai/api/organizations/.../chat_conversations/.../completion
Method: POST
Headers:
  - cookie: sessionKey=...
  - content-type: application/json
Body:
  {
    "prompt": "tu mensaje",
    "timezone": "America/Mexico_City",
    "model": "claude-3-opus-20240229"
  }
Streaming: Sí, SSE
```

### Ejercicio 2: Implementar Rate Limiter

**Objetivo:** Evitar hacer demasiadas peticiones

**Código base:**
```javascript
class RateLimiter {
    constructor(maxRequestsPerSecond) {
        this.queue = [];
        this.processing = false;
        this.delay = 1000 / maxRequestsPerSecond;
    }

    async add(requestFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn: requestFunction, resolve, reject });

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;

        const { fn, resolve, reject } = this.queue.shift();

        try {
            const result = await fn();
            resolve(result);
        } catch (error) {
            reject(error);
        }

        // Esperar antes del siguiente
        await new Promise(r => setTimeout(r, this.delay));

        // Procesar siguiente
        this.processQueue();
    }
}

// Uso
const limiter = new RateLimiter(5);  // 5 req/s

// En lugar de:
// await sendToMistral(prompt)

// Usar:
await limiter.add(() => sendToMistral(prompt));
```

### Ejercicio 3: Cache de Respuestas

**Objetivo:** No hacer peticiones repetidas

**Implementación:**
```javascript
class ResponseCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    // Generar key único del prompt
    getKey(prompt) {
        return crypto.subtle.digest('SHA-256',
            new TextEncoder().encode(prompt)
        ).then(hash =>
            Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
        );
    }

    async get(prompt) {
        const key = await this.getKey(prompt);
        return this.cache.get(key);
    }

    async set(prompt, response) {
        const key = await this.getKey(prompt);

        // Si está lleno, borrar el más viejo
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            response,
            timestamp: Date.now()
        });
    }
}

// Uso
const cache = new ResponseCache();

async function sendWithCache(prompt) {
    // Buscar en cache
    const cached = await cache.get(prompt);

    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
        console.log('[Cache] Hit!');
        return cached.response;
    }

    // Si no está, hacer petición
    console.log('[Cache] Miss, fetching...');
    const response = await sendToMistral(prompt);

    // Guardar en cache
    await cache.set(prompt, response);

    return response;
}
```

---

## 🎓 Conclusión

**Lo que aprendiste:**

1. ✅ **Content Scripts vs Background Scripts**
   - Content scripts corren en el contexto de la página
   - Background scripts corren aislados
   - Usamos content scripts para acceder a cookies

2. ✅ **Streaming con SSE**
   - Server-Sent Events para respuestas en tiempo real
   - Formato `data: {...}\n\n`
   - Usar `ReadableStream` reader

3. ✅ **APIs OpenAI-compatible**
   - Mistral y DeepSeek usan el mismo formato
   - Headers: `Authorization: Bearer sk-...`
   - Body: `{ model, messages, stream }`

4. ✅ **Debugging profesional**
   - Chrome DevTools Network tab
   - Copy as cURL/Fetch
   - Logs estructurados

**Próximos pasos:**

1. Implementa otra IA (Claude, Llama, etc.)
2. Agrega retry logic para peticiones fallidas
3. Implementa cache y rate limiting
4. Crea un sistema de "moderation" para filtrar contenido

---

**¿Preguntas?**

Revisa `ARQUITECTURA_TECNICA.md` para más detalles conceptuales.

**Autor:** Análisis práctico de Milana Extension
**Fecha:** 2025-01-23
