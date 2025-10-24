# 🔧 Arquitectura Técnica: Comunicación con Backends de IA

## 📋 Índice
1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Tipos de Comunicación](#tipos-de-comunicación)
3. [Chrome Extension Manifest V3](#chrome-extension-manifest-v3)
4. [Técnicas de "Spoofing" Web](#técnicas-de-spoofing-web)
5. [Server-Sent Events (SSE)](#server-sent-events-sse)
6. [Casos Prácticos por IA](#casos-prácticos-por-ia)
7. [Herramientas de Análisis](#herramientas-de-análisis)

---

## 1. Conceptos Fundamentales

### ¿Qué es un Backend API?

Cuando visitas `chatgpt.com`, tu navegador hace peticiones HTTP al backend de OpenAI. Estas peticiones incluyen:

```
Cliente (Navegador) → HTTP Request → Servidor Backend
                     ↓
            Headers, Cookies, Body
                     ↓
            Servidor procesa
                     ↓
Cliente ← HTTP Response ← Servidor Backend
```

### Componentes de una Petición HTTP

```http
POST /api/chat HTTP/1.1
Host: chatgpt.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Cookie: session_token=abc123...
Origin: https://chatgpt.com
Content-Type: application/json
Authorization: Bearer token_xyz...

{
  "message": "Hola, ¿cómo estás?",
  "model": "gpt-4"
}
```

**Elementos clave:**
- **Headers**: Metadatos de la petición
- **Cookies**: Autenticación persistente
- **Origin**: De dónde viene la petición
- **Body**: Datos enviados al servidor

---

## 2. Tipos de Comunicación

### 2.1 Webapp Mode (ChatGPT, Gemini, Perplexity)

**¿Cómo funciona?**

```javascript
// Inyectamos código en la página web real
chrome.tabs.executeScript({
  code: `
    // Estamos DENTRO de chatgpt.com
    // Tenemos acceso a sus cookies y sesión
    fetch('https://chatgpt.com/backend-api/conversation', {
      credentials: 'include',  // Envía las cookies de la sesión
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: prompt })
    })
  `
})
```

**Ventajas:**
- ✅ Usa la sesión del usuario (cookies automáticas)
- ✅ No necesita API key
- ✅ El servidor cree que es una petición legítima de su propia web

**Limitaciones:**
- ❌ Usuario debe estar logueado en el navegador
- ❌ Puede romper si la web cambia su estructura
- ❌ Requiere que el usuario resuelva CAPTCHAs manualmente

### 2.2 API Direct Mode (Mistral, DeepSeek)

**¿Cómo funciona?**

```javascript
// Petición directa desde el background script
fetch('https://api.mistral.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'mistral-large-latest',
    messages: [{ role: 'user', content: 'Hola' }],
    stream: true
  })
})
```

**Ventajas:**
- ✅ No depende de sesiones web
- ✅ Más estable y confiable
- ✅ Documentación oficial de la API

**Limitaciones:**
- ❌ Requiere API key (aunque sean gratuitas)
- ❌ Puede tener rate limits

---

## 3. Chrome Extension Manifest V3

### Arquitectura de la Extensión

```
┌─────────────────────────────────────────────────┐
│                  POPUP (index.html)              │
│  - UI del usuario                                │
│  - No tiene acceso directo a tabs               │
└─────────────┬───────────────────────────────────┘
              │
              │ chrome.runtime.sendMessage()
              ↓
┌─────────────────────────────────────────────────┐
│           SERVICE WORKER (background.js)         │
│  - Corre en background permanentemente           │
│  - Puede hacer fetch() a cualquier URL          │
│  - NO tiene acceso al DOM de tabs               │
└─────────────┬───────────────────────────────────┘
              │
              │ chrome.scripting.executeScript()
              ↓
┌─────────────────────────────────────────────────┐
│           CONTENT SCRIPT (inyectado)             │
│  - Corre DENTRO de la página web                │
│  - Tiene acceso a cookies y DOM                 │
│  - Puede fingir ser parte de la web             │
└─────────────────────────────────────────────────┘
```

### Permisos Críticos en manifest.json

```json
{
  "permissions": [
    "storage",           // Guardar API keys y configuración
    "tabs",             // Acceder a tabs del navegador
    "scripting",        // Inyectar código en páginas
    "activeTab"         // Acceder al tab activo
  ],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://api.mistral.ai/*",
    "https://api.deepseek.com/*"
  ]
}
```

**¿Por qué necesitamos estos permisos?**

- `host_permissions`: Sin esto, Chrome **bloquea** nuestras peticiones por CORS
- `scripting`: Para inyectar código que ejecute peticiones "desde dentro" de la web
- `storage`: Para guardar tokens de sesión y API keys

---

## 4. Técnicas de "Spoofing" Web

### 4.1 Origin Spoofing con declarativeNetRequest

**Problema:**
```
Browser Extension → fetch('perplexity.ai/api')
                    ↓
            Origin: chrome-extension://abc123
                    ↓
            🚫 Servidor rechaza (CORS)
```

**Solución: Modificar Headers**

En `src/rules/pplx.json` (ChatHub):
```json
{
  "id": 1,
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      {
        "header": "origin",
        "operation": "set",
        "value": "https://labs.perplexity.ai"  // 🎭 Fingimos venir de aquí
      }
    ]
  },
  "condition": {
    "requestDomains": ["www.perplexity.ai"]
  }
}
```

**¿Qué hace esto?**
- Intercepta **todas** las peticiones a `perplexity.ai`
- Reemplaza el header `Origin` antes de que llegue al servidor
- El servidor cree que la petición viene de su propia web

### 4.2 Cookie Injection

**Método 1: Usando la sesión existente**

```javascript
// Content script inyectado en chatgpt.com
const response = await fetch('/backend-api/conversation', {
  credentials: 'include',  // ✨ Incluye automáticamente las cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**¿Por qué funciona?**
- El código corre **dentro** del contexto de `chatgpt.com`
- Las cookies de sesión se envían automáticamente
- El servidor ve una petición legítima

**Método 2: Copiar cookies manualmente**

```javascript
// Obtener cookies de la página
chrome.cookies.getAll({ domain: 'chatgpt.com' }, (cookies) => {
  const sessionToken = cookies.find(c => c.name === '__Secure-next-auth.session-token')

  // Usar en petición
  fetch('https://chatgpt.com/api', {
    headers: {
      'Cookie': `session-token=${sessionToken.value}`
    }
  })
})
```

### 4.3 User-Agent Spoofing

```javascript
fetch('https://api.example.com', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    // 👆 Fingimos ser un navegador normal
  }
})
```

---

## 5. Server-Sent Events (SSE)

### ¿Qué es SSE?

SSE permite que el servidor envíe datos **continuamente** al cliente sin que el cliente tenga que preguntar.

```
Cliente: "Dame la respuesta"
         ↓
Servidor: "Ho..."
         ↓
Servidor: "Hola..."
         ↓
Servidor: "Hola, ¿có..."
         ↓
Servidor: "Hola, ¿cómo estás?"
         ↓
Servidor: [DONE]
```

### Implementación en Perplexity

```javascript
async function sendToPerplexityDirect(prompt) {
  const response = await fetch('https://www.perplexity.ai/rest/sse/perplexity_ask', {
    method: 'POST',
    body: JSON.stringify({
      query_str: prompt,
      params: { mode: 'copilot' }
    })
  })

  // Leer streaming
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    // chunk = "data: {\"text\":\"Hola\"}\n"

    const lines = chunk.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6)  // Quitar "data: "
        const data = JSON.parse(jsonStr)

        // Mostrar en UI
        updateUI(data.text)
      }
    }
  }
}
```

**Formato SSE:**
```
data: {"text": "Hola"}

data: {"text": "Hola, ¿cómo"}

data: {"text": "Hola, ¿cómo estás?"}

data: [DONE]
```

### Implementación en Mistral (OpenAI-compatible)

```javascript
const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'mistral-large-latest',
    messages: [{ role: 'user', content: prompt }],
    stream: true  // 🌊 Activar streaming
  })
})

const reader = response.body.getReader()
let fullText = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue

    const jsonStr = line.substring(6)
    if (jsonStr === '[DONE]') continue

    const data = JSON.parse(jsonStr)
    // data = { choices: [{ delta: { content: "texto" } }] }

    if (data.choices[0]?.delta?.content) {
      fullText += data.choices[0].delta.content
      updateUI(fullText)  // Actualizar en tiempo real
    }
  }
}
```

---

## 6. Casos Prácticos por IA

### 6.1 ChatGPT (Webapp Mode)

**Endpoints descubiertos:**
```
POST /backend-api/conversation
Host: chatgpt.com

Headers necesarios:
- Cookie: __Secure-next-auth.session-token=...
- Content-Type: application/json
- Authorization: Bearer eyJhbG... (token JWT)
```

**Cómo obtener el token:**
```javascript
// Inyectar en chatgpt.com
const accessToken = await (async () => {
  const response = await fetch('https://chatgpt.com/api/auth/session')
  const data = await response.json()
  return data.accessToken
})()
```

**Body de la petición:**
```json
{
  "action": "next",
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": { "parts": ["Hola, ¿cómo estás?"] }
    }
  ],
  "model": "gpt-4",
  "parent_message_id": "00000000-0000-0000-0000-000000000000"
}
```

### 6.2 Gemini (Webapp Mode)

**Endpoints:**
```
POST /_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate
Host: gemini.google.com
```

**Headers críticos:**
```
Cookie: __Secure-1PSID=...
X-Same-Domain: 1
Content-Type: application/x-www-form-urlencoded
```

**Proceso:**
1. Usuario logueado en Google
2. Inyectamos script en `gemini.google.com`
3. Extraemos cookies automáticamente
4. Hacemos POST al endpoint interno

### 6.3 Perplexity (Webapp Mode + Origin Spoofing)

**Desafío:** Perplexity verifica el `Origin` header

**Solución:**
```json
// manifest.json
"declarative_net_request": {
  "rule_resources": [{
    "id": "pplx_rules",
    "path": "rules/pplx.json"
  }]
}

// rules/pplx.json
{
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [{
      "header": "origin",
      "operation": "set",
      "value": "https://labs.perplexity.ai"
    }]
  }
}
```

**Petición:**
```javascript
fetch('https://www.perplexity.ai/rest/sse/perplexity_ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // Origin se reemplaza automáticamente
  },
  body: JSON.stringify({
    query_str: prompt,
    params: {
      mode: 'copilot',
      search_focus: 'internet',
      last_backend_uuid: null  // Para mantener contexto
    }
  })
})
```

### 6.4 Mistral (API Directa)

**API oficial:**
```bash
curl https://api.mistral.ai/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral-large-latest",
    "messages": [{"role": "user", "content": "Hola"}],
    "stream": true
  }'
```

**No necesita spoofing:**
- API oficial y documentada
- Autenticación con API key
- Formato OpenAI-compatible

### 6.5 DeepSeek (API Directa)

**Mismo formato que OpenAI:**
```javascript
fetch('https://api.deepseek.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer sk-...`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  })
})
```

---

## 7. Herramientas de Análisis

### 7.1 Chrome DevTools Network Tab

**Cómo analizar una web:**

1. Abre `chatgpt.com`
2. F12 → Network tab
3. Filtra por "Fetch/XHR"
4. Escribe un mensaje en ChatGPT
5. Observa las peticiones

**Verás:**
```
POST /backend-api/conversation
Status: 200
Type: text/event-stream

Headers:
  authorization: Bearer eyJhbG...
  cookie: __Secure-next-auth.session-token=...
  content-type: application/json

Payload:
  {message: "test", model: "gpt-4"}

Response:
  data: {"message": {"content": {"parts": ["Hola"]}}}
```

### 7.2 Copiar como cURL

**En Network tab:**
1. Click derecho en la petición
2. "Copy" → "Copy as cURL"
3. Pegar en terminal

```bash
curl 'https://chatgpt.com/backend-api/conversation' \
  -H 'authorization: Bearer eyJhbG...' \
  -H 'cookie: session-token=abc...' \
  --data-raw '{"message":"test"}'
```

**Ahora puedes replicarlo en código:**
```javascript
fetch('https://chatgpt.com/backend-api/conversation', {
  headers: {
    'authorization': 'Bearer eyJhbG...',
    'cookie': 'session-token=abc...'
  },
  body: JSON.stringify({ message: 'test' })
})
```

### 7.3 Extensiones Útiles

- **ModHeader**: Modificar headers manualmente
- **EditThisCookie**: Ver y editar cookies
- **Postman Interceptor**: Capturar peticiones del navegador

---

## 🔒 Consideraciones de Seguridad

### CORS (Cross-Origin Resource Sharing)

**Problema:**
```
Extension (chrome-extension://abc) → chatgpt.com
                                     ↓
                            🚫 CORS Error
```

**Solución:**
```json
// manifest.json
"host_permissions": [
  "https://chatgpt.com/*"
]
```

Chrome permite a extensiones con `host_permissions` saltar CORS.

### Content Security Policy (CSP)

Algunas webs bloquean scripts inyectados:
```http
Content-Security-Policy: script-src 'self'
```

**Solución:**
```json
// manifest.json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Rate Limiting

**APIs pueden limitar peticiones:**
- Mistral: 5 req/segundo gratis
- DeepSeek: 60 req/minuto gratis

**Solución:** Implementar cola de peticiones:
```javascript
class RateLimiter {
  constructor(maxPerSecond) {
    this.queue = []
    this.processing = false
    this.maxPerSecond = maxPerSecond
  }

  async add(fn) {
    this.queue.push(fn)
    if (!this.processing) this.process()
  }

  async process() {
    this.processing = true
    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      await fn()
      await sleep(1000 / this.maxPerSecond)
    }
    this.processing = false
  }
}
```

---

## 📊 Flujo Completo de una Petición

### Ejemplo: Usuario envía "Hola" a ChatGPT

```
1. Usuario escribe "Hola" en popup
   ↓
2. popup.html llama: chrome.runtime.sendMessage({type: 'SEND_TO_CHATGPT', prompt: 'Hola'})
   ↓
3. background.js recibe el mensaje
   ↓
4. background.js inyecta content script en chatgpt.com:
   chrome.scripting.executeScript({
     target: { tabId: chatgptTab.id },
     func: (prompt) => {
       // Este código corre DENTRO de chatgpt.com
       fetch('/backend-api/conversation', {
         credentials: 'include',  // Usa cookies de sesión
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: prompt })
       })
       .then(res => res.body.getReader())
       .then(reader => {
         // Leer streaming
         return reader.read().then(function process({done, value}) {
           if (done) return
           const text = new TextDecoder().decode(value)
           // Enviar a background
           chrome.runtime.sendMessage({
             type: 'STREAMING_UPDATE',
             ai: 'chatgpt',
             text: text
           })
           return reader.read().then(process)
         })
       })
     },
     args: ['Hola']
   })
   ↓
5. Content script hace fetch a /backend-api/conversation
   ↓
6. Servidor ChatGPT recibe petición (ve cookies válidas)
   ↓
7. Servidor responde con streaming SSE
   ↓
8. Content script lee chunks y envía a background.js
   ↓
9. background.js reenvía a popup.html
   ↓
10. popup.html actualiza la UI en tiempo real
```

---

## 🎓 Conclusión

**Lo que estamos haciendo:**

1. **Webapp Mode**: Inyectamos código en la página real para usar su sesión autenticada
2. **API Mode**: Hacemos peticiones directas a APIs oficiales con keys
3. **Origin Spoofing**: Modificamos headers para parecer peticiones legítimas
4. **SSE Streaming**: Leemos respuestas en tiempo real chunk por chunk
5. **Manifest V3**: Usamos service workers y content scripts para coordinar todo

**Es legal siempre que:**
- ✅ Usemos nuestra propia cuenta/API key
- ✅ No violemos términos de servicio (uso personal)
- ✅ No intentemos saltarnos rate limits abusivamente
- ✅ No extraigamos datos a gran escala (scraping masivo)

**Tecnologías clave:**
- Chrome Extensions API
- Fetch API + Streaming
- Server-Sent Events (SSE)
- HTTP Headers manipulation
- JavaScript Promises/Async
- Content Security Policy bypass

---

## 📚 Recursos para Aprender Más

1. **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
2. **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
3. **SSE**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
4. **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
5. **HTTP Headers**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers

---

**Autor:** Análisis técnico de Milana Extension
**Fecha:** 2025-01-23
**Versión:** 1.0
