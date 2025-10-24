# 📊 Diagramas Visuales: Flujo de Datos

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Flujo ChatGPT Webapp](#flujo-chatgpt-webapp)
3. [Flujo Mistral API](#flujo-mistral-api)
4. [Comparación CORS](#comparación-cors)
5. [Streaming SSE](#streaming-sse)

---

## 1. Arquitectura General

### Componentes de la Extensión

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     POPUP UI                              │  │
│  │                   (index.html)                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │ ChatGPT  │  │  Gemini  │  │ Mistral  │  ...          │  │
│  │  │ Column   │  │ Column   │  │ Column   │               │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘               │  │
│  │       │             │             │                       │  │
│  │       └─────────────┴─────────────┘                       │  │
│  │                     │                                      │  │
│  │                     │ chrome.runtime.sendMessage()        │  │
│  └─────────────────────┼──────────────────────────────────────┘  │
│                        │                                          │
│                        ↓                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SERVICE WORKER                              │    │
│  │            (background_streaming.js)                     │    │
│  │                                                           │    │
│  │  ┌─────────────┐    ┌──────────────┐    ┌────────────┐ │    │
│  │  │ Message     │    │ API Handler  │    │ Storage    │ │    │
│  │  │ Router      ├───→│              ├───→│ Manager    │ │    │
│  │  └─────────────┘    └──────┬───────┘    └────────────┘ │    │
│  │                             │                            │    │
│  └─────────────────────────────┼────────────────────────────┘    │
│                                │                                  │
│                   ┌────────────┴────────────┐                    │
│                   │                         │                    │
│                   ↓                         ↓                    │
│  ┌────────────────────────┐   ┌────────────────────────┐        │
│  │  WEBAPP MODE           │   │  API DIRECT MODE       │        │
│  │                        │   │                        │        │
│  │  chrome.scripting      │   │  Direct fetch()        │        │
│  │  .executeScript()      │   │  with API key          │        │
│  │         ↓              │   │         ↓              │        │
│  │  ┌──────────────────┐ │   │  No tab needed         │        │
│  │  │  Content Script  │ │   │                        │        │
│  │  │  Injected in tab │ │   │  ┌──────────────────┐ │        │
│  │  │  ↓               │ │   │  │ API Key from     │ │        │
│  │  │  fetch() with    │ │   │  │ chrome.storage   │ │        │
│  │  │  cookies         │ │   │  └──────────────────┘ │        │
│  │  └──────────────────┘ │   │                        │        │
│  └────────────────────────┘   └────────────────────────┘        │
│              │                            │                      │
└──────────────┼────────────────────────────┼──────────────────────┘
               │                            │
               ↓                            ↓
    ┌─────────────────────┐    ┌──────────────────────┐
    │   chatgpt.com       │    │  api.mistral.ai      │
    │   Backend Server    │    │  Public API          │
    └─────────────────────┘    └──────────────────────┘
```

---

## 2. Flujo ChatGPT Webapp

### Paso a Paso Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario escribe "Hola" en popup                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: popup.html → chrome.runtime.sendMessage()               │
│                                                                  │
│  {                                                               │
│    type: 'SEND_TO_AI',                                          │
│    aiType: 'chatgpt',                                           │
│    prompt: 'Hola'                                               │
│  }                                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: background.js recibe mensaje                            │
│                                                                  │
│  chrome.runtime.onMessage.addListener((msg) => {                │
│    if (msg.type === 'SEND_TO_AI') {                            │
│      if (msg.aiType === 'chatgpt') {                           │
│        sendToChatGPTDirect(msg.prompt)                          │
│      }                                                           │
│    }                                                             │
│  })                                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Buscar tab de ChatGPT                                   │
│                                                                  │
│  const tabs = await chrome.tabs.query({                         │
│    url: 'https://chatgpt.com/*'                                 │
│  })                                                              │
│                                                                  │
│  if (tabs.length === 0) {                                       │
│    throw new Error('No hay tab abierta')                        │
│  }                                                               │
│                                                                  │
│  const chatgptTab = tabs[0]  // Tab ID: 1234                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Inyectar content script                                 │
│                                                                  │
│  chrome.scripting.executeScript({                               │
│    target: { tabId: 1234 },                                     │
│    func: (prompt) => {                                          │
│      // Este código corre DENTRO de chatgpt.com                 │
│      ...                                                         │
│    },                                                            │
│    args: ['Hola']                                               │
│  })                                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Content Script en chatgpt.com                           │
│                                                                  │
│  ╔═══════════════════════════════════════════════════╗          │
│  ║  CONTEXT: https://chatgpt.com                     ║          │
│  ║  Tiene acceso a:                                  ║          │
│  ║  ✓ Cookies de sesión                             ║          │
│  ║  ✓ localStorage                                   ║          │
│  ║  ✓ DOM de la página                              ║          │
│  ╚═══════════════════════════════════════════════════╝          │
│                                                                  │
│  // Obtener token de acceso                                     │
│  const res = await fetch('/api/auth/session')                   │
│  const { accessToken } = await res.json()                       │
│                                                                  │
│  Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1U...    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: Hacer petición al backend                               │
│                                                                  │
│  const response = await fetch(                                  │
│    'https://chatgpt.com/backend-api/conversation',              │
│    {                                                             │
│      method: 'POST',                                             │
│      credentials: 'include',  // 🔑 Envía cookies               │
│      headers: {                                                  │
│        'Authorization': `Bearer ${accessToken}`,                 │
│        'Content-Type': 'application/json'                        │
│      },                                                          │
│      body: JSON.stringify({                                      │
│        messages: [{ role: 'user', content: 'Hola' }],           │
│        model: 'gpt-4'                                            │
│      })                                                          │
│    }                                                             │
│  )                                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 8: Petición viaja a servidor                               │
│                                                                  │
│  GET /backend-api/conversation HTTP/1.1                         │
│  Host: chatgpt.com                                              │
│  Origin: https://chatgpt.com  ← ✅ Mismo origen                │
│  Cookie: session-token=abc123... ← ✅ Sesión válida            │
│  Authorization: Bearer eyJhbG... ← ✅ Token válido              │
│                                                                  │
│  Servidor piensa:                                               │
│  "Esta petición viene de mi propia web, está autenticada,       │
│   tiene una sesión válida. ✓ Procesar."                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 9: Servidor responde con streaming                         │
│                                                                  │
│  HTTP/1.1 200 OK                                                │
│  Content-Type: text/event-stream                                │
│  Transfer-Encoding: chunked                                     │
│                                                                  │
│  data: {"message":{"content":{"parts":["¡"]}}}                 │
│                                                                  │
│  data: {"message":{"content":{"parts":["¡Hola"]}}}             │
│                                                                  │
│  data: {"message":{"content":{"parts":["¡Hola!"]}}}            │
│                                                                  │
│  data: [DONE]                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 10: Content script lee stream                              │
│                                                                  │
│  const reader = response.body.getReader()                       │
│                                                                  │
│  while (true) {                                                  │
│    const { value } = await reader.read()                        │
│    const chunk = decoder.decode(value)                          │
│                                                                  │
│    // Parsear y enviar a background                             │
│    chrome.runtime.sendMessage({                                 │
│      type: 'STREAMING_UPDATE',                                  │
│      ai: 'chatgpt',                                             │
│      response: '¡Hola!'                                         │
│    })                                                            │
│  }                                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 11: background.js reenvía a popup                          │
│                                                                  │
│  chrome.runtime.onMessage.addListener((msg) => {                │
│    if (msg.type === 'STREAMING_UPDATE') {                      │
│      // Reenviar a popup (si está abierto)                     │
│      chrome.runtime.sendMessage(msg)                            │
│    }                                                             │
│  })                                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 12: popup.html actualiza UI                                │
│                                                                  │
│  chrome.runtime.onMessage.addListener((msg) => {                │
│    if (msg.ai === 'chatgpt') {                                 │
│      const element = document.getElementById('chatgpt-response')│
│      element.textContent = msg.response  // "¡Hola!"           │
│    }                                                             │
│  })                                                              │
│                                                                  │
│  Usuario ve:                                                     │
│  ┌─────────────────────┐                                        │
│  │ ChatGPT             │                                        │
│  ├─────────────────────┤                                        │
│  │ ¡Hola!              │                                        │
│  │                     │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo Mistral API

### Mucho más simple (sin tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario escribe "Hola" en popup                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: popup.html → background.js                              │
│                                                                  │
│  chrome.runtime.sendMessage({                                   │
│    type: 'SEND_TO_AI',                                          │
│    aiType: 'mistral',                                           │
│    prompt: 'Hola'                                               │
│  })                                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: background.js obtiene API key                           │
│                                                                  │
│  const apiKey = await new Promise(resolve => {                  │
│    chrome.storage.local.get(['mistralApiKey'], (data) => {     │
│      resolve(data.mistralApiKey)                                │
│    })                                                            │
│  })                                                              │
│                                                                  │
│  apiKey = "sk-proj-abc123..."                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Petición DIRECTA a API (no necesita tab)                │
│                                                                  │
│  const response = await fetch(                                  │
│    'https://api.mistral.ai/v1/chat/completions',                │
│    {                                                             │
│      method: 'POST',                                             │
│      headers: {                                                  │
│        'Authorization': `Bearer ${apiKey}`,                      │
│        'Content-Type': 'application/json'                        │
│      },                                                          │
│      body: JSON.stringify({                                      │
│        model: 'mistral-large-latest',                            │
│        messages: [{ role: 'user', content: 'Hola' }],           │
│        stream: true                                              │
│      })                                                          │
│    }                                                             │
│  )                                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: API responde con streaming                              │
│                                                                  │
│  HTTP/1.1 200 OK                                                │
│  Content-Type: text/event-stream                                │
│                                                                  │
│  data: {"choices":[{"delta":{"content":"¡"}}]}                 │
│                                                                  │
│  data: {"choices":[{"delta":{"content":"Hola"}}]}              │
│                                                                  │
│  data: {"choices":[{"delta":{"content":"!"}}]}                 │
│                                                                  │
│  data: [DONE]                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: background.js lee stream y envía a popup                │
│                                                                  │
│  const reader = response.body.getReader()                       │
│  let fullText = ''                                              │
│                                                                  │
│  while (true) {                                                  │
│    const { value } = await reader.read()                        │
│    const data = JSON.parse(...)                                 │
│    fullText += data.choices[0].delta.content                    │
│                                                                  │
│    chrome.runtime.sendMessage({                                 │
│      type: 'STREAMING_UPDATE',                                  │
│      ai: 'mistral',                                             │
│      response: fullText  // "¡Hola!"                           │
│    })                                                            │
│  }                                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: popup.html muestra respuesta                            │
│                                                                  │
│  Usuario ve:                                                     │
│  ┌─────────────────────┐                                        │
│  │ Mistral             │                                        │
│  ├─────────────────────┤                                        │
│  │ ¡Hola!              │                                        │
│  │                     │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Diferencia clave:**
- ❌ No necesita inyectar en tab
- ❌ No necesita cookies
- ✅ Solo API key en header
- ✅ Mucho más simple y confiable

---

## 4. Comparación CORS

### ❌ Lo que NO funciona

```
┌───────────────────────────────────────────────────────┐
│  Extension Background (chrome-extension://abc123)     │
│                                                        │
│  fetch('https://chatgpt.com/backend-api/conversation')│
│    ↓                                                   │
└────┼───────────────────────────────────────────────────┘
     │
     │ Petición HTTP
     ↓
┌─────────────────────────────────────────────────────────┐
│  GET /backend-api/conversation HTTP/1.1                 │
│  Host: chatgpt.com                                      │
│  Origin: chrome-extension://abc123  ← ⚠️ Problema     │
│  Cookie: (vacío)                     ← ⚠️ No hay cookies│
└────┼────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────┐
│  Servidor ChatGPT:                                      │
│                                                          │
│  1. Ve Origin: chrome-extension://abc123                │
│     ❌ "No es mi dominio, rechazar"                     │
│                                                          │
│  2. Responde con:                                        │
│     HTTP/1.1 403 Forbidden                              │
│     Access-Control-Allow-Origin: https://chatgpt.com    │
│                                                          │
│  3. Navegador ve que Origins no coinciden:              │
│     ❌ CORS Error                                       │
└─────────────────────────────────────────────────────────┘
```

### ✅ Lo que SÍ funciona

```
┌─────────────────────────────────────────────────────────┐
│  Extension Background                                    │
│  chrome.scripting.executeScript()                       │
│    ↓                                                     │
└────┼────────────────────────────────────────────────────┘
     │
     │ Inyecta código
     ↓
┌─────────────────────────────────────────────────────────┐
│  Content Script en chatgpt.com                           │
│  ╔═══════════════════════════════════════╗              │
│  ║  CONTEXT: https://chatgpt.com         ║              │
│  ╚═══════════════════════════════════════╝              │
│                                                          │
│  fetch('/backend-api/conversation')                     │
│    ↓                                                     │
└────┼────────────────────────────────────────────────────┘
     │
     │ Petición HTTP
     ↓
┌─────────────────────────────────────────────────────────┐
│  GET /backend-api/conversation HTTP/1.1                 │
│  Host: chatgpt.com                                      │
│  Origin: https://chatgpt.com         ← ✅ Mismo origen │
│  Cookie: session-token=abc...         ← ✅ Cookies auto│
└────┼────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────┐
│  Servidor ChatGPT:                                      │
│                                                          │
│  1. Ve Origin: https://chatgpt.com                      │
│     ✅ "Es mi propio dominio"                           │
│                                                          │
│  2. Ve Cookie: session-token=abc...                     │
│     ✅ "Usuario autenticado"                            │
│                                                          │
│  3. Responde con:                                        │
│     HTTP/1.1 200 OK                                     │
│     ✅ Datos enviados                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Streaming SSE

### Timeline de una respuesta

```
t=0ms: Usuario presiona Enter
│
├─ t=50ms: Petición enviada
│   │
│   POST /api/chat/completions
│   Body: { prompt: "Escribe un cuento" }
│
├─ t=200ms: Servidor procesa, inicia stream
│   │
│   HTTP/1.1 200 OK
│   Content-Type: text/event-stream
│   Transfer-Encoding: chunked
│
├─ t=300ms: Primer chunk
│   │
│   data: {"choices":[{"delta":{"content":"Había"}}]}
│   │
│   UI actualiza: "Había"
│
├─ t=350ms: Segundo chunk
│   │
│   data: {"choices":[{"delta":{"content":" una"}}]}
│   │
│   UI actualiza: "Había una"
│
├─ t=400ms: Tercer chunk
│   │
│   data: {"choices":[{"delta":{"content":" vez"}}]}
│   │
│   UI actualiza: "Había una vez"
│
├─ t=450ms: Cuarto chunk
│   │
│   data: {"choices":[{"delta":{"content":"..."}}]}
│   │
│   UI actualiza: "Había una vez..."
│
│  ... (muchos más chunks)
│
└─ t=5000ms: Stream completo
    │
    data: [DONE]
    │
    ✓ Respuesta finalizada
```

### Comparación: Streaming vs No-Streaming

**Sin Streaming:**
```
Usuario espera... ⏳
│
│ (5 segundos de silencio)
│
└─→ "Había una vez un reino mágico donde vivían dragones..."
    (Todo de golpe)
```

**Con Streaming:**
```
Usuario ve en tiempo real:

0.3s: "Había"
0.4s: "Había una"
0.5s: "Había una vez"
0.6s: "Había una vez un"
0.7s: "Había una vez un reino"
0.8s: "Había una vez un reino mágico"
...

(Experiencia fluida, como si escribiera en vivo)
```

---

## 🔑 Conceptos Clave Visualizados

### 1. Same-Origin Policy

```
PERMITIDO ✅
┌─────────────────────────────────┐
│  chatgpt.com/page.html          │
│    ↓ fetch()                    │
│  chatgpt.com/api/chat           │
│  (Mismo origen)                 │
└─────────────────────────────────┘

BLOQUEADO ❌
┌─────────────────────────────────┐
│  example.com/page.html          │
│    ↓ fetch()                    │
│  chatgpt.com/api/chat           │
│  (Diferente origen) ← CORS Error│
└─────────────────────────────────┘

TRUCO DE EXTENSIÓN ✅
┌─────────────────────────────────┐
│  Extension inyecta código en:   │
│  chatgpt.com/cualquier-pagina   │
│    ↓ fetch()                    │
│  chatgpt.com/api/chat           │
│  (¡Ahora es mismo origen!)      │
└─────────────────────────────────┘
```

### 2. Cookie Flow

```
Sesión del Usuario:
┌──────────────────────────────────────┐
│  Usuario se loguea en chatgpt.com   │
│    ↓                                 │
│  Servidor envía cookie:              │
│  Set-Cookie: session=abc123...       │
│    ↓                                 │
│  Navegador guarda en:                │
│  Domain: chatgpt.com                 │
└──────────────────────────────────────┘

Uso Automático:
┌──────────────────────────────────────┐
│  Content script en chatgpt.com       │
│  hace fetch('/api/chat')             │
│    ↓                                 │
│  Navegador automáticamente agrega:   │
│  Cookie: session=abc123...           │
│    ↓                                 │
│  Servidor valida cookie              │
│  ✅ "Usuario autenticado"            │
└──────────────────────────────────────┘
```

### 3. Manifest V3 Permissions

```
SIN PERMISOS:
┌─────────────────────────────────┐
│  Extension intenta:             │
│  fetch('chatgpt.com/api')       │
│    ↓                            │
│  ❌ Chrome: "No autorizado"     │
└─────────────────────────────────┘

CON PERMISOS:
┌─────────────────────────────────┐
│  manifest.json:                 │
│  "host_permissions": [          │
│    "https://chatgpt.com/*"      │
│  ]                              │
│    ↓                            │
│  Extension intenta:             │
│  fetch('chatgpt.com/api')       │
│    ↓                            │
│  ✅ Chrome: "Permitido"         │
└─────────────────────────────────┘
```

---

## 📊 Resumen Visual

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    USER INTERFACE                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ HTML/CSS│  │ JavaScript│  │  Icons  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
├─────────────────────────────────────────────────────┤
│              CHROME EXTENSION APIs                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Runtime  │  │ Scripting│  │ Storage  │         │
│  │ Messages │  │ Injection│  │  API     │         │
│  └──────────┘  └──────────┘  └──────────┘         │
├─────────────────────────────────────────────────────┤
│                 COMMUNICATION                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Fetch   │  │   SSE    │  │  Cookies │         │
│  │   API    │  │Streaming │  │  Headers │         │
│  └──────────┘  └──────────┘  └──────────┘         │
├─────────────────────────────────────────────────────┤
│                  BACKENDS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ ChatGPT  │  │  Gemini  │  │ Mistral  │         │
│  │ Servers  │  │ Servers  │  │   API    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

---

**Usa estos diagramas junto con:**
- `ARQUITECTURA_TECNICA.md` para entender conceptos
- `EJEMPLOS_PRACTICOS.md` para ver código real

**Autor:** Diagramas visuales de Milana Extension
**Fecha:** 2025-01-23
