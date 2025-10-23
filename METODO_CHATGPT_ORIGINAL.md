# Método ChatGPT Original - Análisis de 3.99.4_0

## Resumen
La extensión original usa **declarativeNetRequest** para modificar headers de peticiones y un sistema de **proof-of-work** con Web Workers para hacer peticiones directas al backend de ChatGPT.

## 1. Modificación de Headers (declarativeNetRequest)

### Archivo: `3.99.4_0/src/rules/chatgpt.json`

```json
{
  "id": 1,
  "priority": 1,
  "action": {
    "type": "modifyHeaders",
    "requestHeaders": [
      {
        "header": "origin",
        "operation": "set",
        "value": "https://chatgpt.com"
      },
      {
        "header": "referer",
        "operation": "set",
        "value": "https://chatgpt.com/"
      }
    ]
  },
  "condition": {
    "domainType": "thirdParty",
    "requestDomains": ["chatgpt.com"],
    "excludedInitiatorDomains": ["chatgpt.com", "openai.com"],
    "resourceTypes": ["xmlhttprequest"]
  }
}
```

**¿Qué hace?**
- Intercepta peticiones XMLHttpRequest a `chatgpt.com` desde dominios de terceros
- Establece `origin: https://chatgpt.com` y `referer: https://chatgpt.com/`
- Así ChatGPT acepta las peticiones como si vinieran de su propia página

## 2. Endpoints del Backend

### Autenticación
```javascript
GET https://chatgpt.com/api/auth/session
// Obtiene el accessToken
```

### Chat Requirements (antes de enviar mensaje)
```javascript
POST https://chatgpt.com/backend-api/sentinel/chat-requirements
Body: { p: "gAAAAAC..." } // proof token
// Devuelve: { token, proofofwork: { seed, difficulty } }
```

### Enviar Mensaje
```javascript
POST https://chatgpt.com/backend-api/conversation  // Con auth
POST https://chatgpt.com/backend-anon/conversation // Sin auth
```

## 3. Headers Requeridos

```javascript
{
  "accept": "text/event-stream",
  "Content-Type": "application/json",
  "Oai-Device-Id": "...",                              // UUID persistente
  "Oai-Language": "en-US",
  "Openai-Sentinel-Chat-Requirements-Token": "...",   // Del chat-requirements
  "Openai-Sentinel-Proof-Token": "gAAAAAB...",        // Proof of work
  "Authorization": "Bearer <accessToken>"              // Solo con auth
}
```

## 4. Proof of Work con Web Worker

### Sistema de dos niveles:
1. **Proof simple** (`gAAAAAC...`): Para chat-requirements
2. **Proof complejo** (`gAAAAAB...`): Para el mensaje real

```javascript
// Worker calcula basado en:
- seed (del servidor)
- difficulty (del servidor)
- config: [
    navigator.hardwareConcurrency + screen.width + screen.height,
    new Date().toString(),
    performance.memory.jsHeapSizeLimit,
    0,
    navigator.userAgent,
    "", "",
    navigator.language,
    navigator.languages.join(","),
    0
  ]
```

### Archivo: `worker-DrXR2XoY.js`
Calcula el hash y lo cachea en un Map para reutilizarlo

## 5. Body del Mensaje

```javascript
{
  "action": "next",
  "conversation_mode": { "kind": "primary_assistant" },
  "force_nulligen": false,
  "force_paragen": false,
  "force_paragen_model_slug": "",
  "force_rate_limit": false,
  "force_use_sse": true,
  "history_and_training_disabled": false,
  "messages": [{
    "id": "uuid-v4",
    "author": { "role": "user" },
    "content": {
      "content_type": "text",           // o "multimodal_text" para imágenes
      "parts": ["mensaje del usuario"]
    }
  }],
  "model": "gpt-4o",                    // o el modelo correspondiente
  "parent_message_id": "uuid-v4",       // UUID o último messageId
  "conversation_id": "uuid-or-null",    // null para nueva conversación
  "suggestions": []
}
```

## 6. Respuesta (Server-Sent Events)

```javascript
// Formato de cada evento:
data: {"message": {...}, "conversation_id": "...", ...}
data: {"message": {...}, "conversation_id": "...", ...}
data: [DONE]

// Campos importantes:
- message.id: Para siguiente parent_message_id
- message.content.parts[0]: Texto de la respuesta
- conversation_id: Para mantener la conversación
```

## 7. Configuración Manifest.json

```json
{
  "permissions": [
    "storage",
    "unlimitedStorage",
    "declarativeNetRequestWithHostAccess"  // ← CLAVE
  ],
  "host_permissions": ["<all_urls>"],
  "declarative_net_request": {
    "rule_resources": [{
      "enabled": true,
      "id": "ruleset_chatgpt",
      "path": "src/rules/chatgpt.json"
    }]
  }
}
```

## 8. Manejo de Archivos/Imágenes

```javascript
// 1. Iniciar upload
POST /backend-api/files
Body: {
  file_name: "imagen.png",
  file_size: 12345,
  use_case: "multimodal"
}
// Respuesta: { file_id, upload_url }

// 2. Subir archivo
PUT <upload_url>
Headers: {
  "x-ms-blob-type": "BlockBlob",
  "x-ms-version": "2020-04-08",
  "Content-Type": "image/png"
}
Body: <archivo binario>

// 3. Completar upload
POST /backend-api/files/<file_id>/uploaded

// 4. Usar en mensaje
{
  "content": {
    "content_type": "multimodal_text",
    "parts": [
      {
        "asset_pointer": "file-service://<file_id>",
        "width": 800,
        "height": 600,
        "size_bytes": 12345
      },
      "texto del mensaje"
    ]
  }
}
```

## 9. Gestión de Device ID

```javascript
function getDeviceId() {
  let deviceId = localStorage.getItem('oai_device_id');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('oai_device_id', deviceId);
  }
  return deviceId;
}
```

## Puntos Clave para Implementar

1. ✅ **declarativeNetRequest** es ESENCIAL - sin esto, ChatGPT rechaza las peticiones por CORS
2. ✅ **Web Worker** para proof-of-work - evita bloquear la UI
3. ✅ **Flujo**: chat-requirements → proof-of-work → mensaje
4. ✅ **Mantener estado**: conversationId y lastMessageId para conversaciones continuas
5. ✅ **Headers correctos**: Oai-Device-Id, Sentinel tokens, etc.
6. ✅ **SSE Parsing**: Parsear eventos server-sent correctamente

## Diferencias con Nuestra Implementación Actual

| Aspecto | Original | Nuestra |
|---------|----------|---------|
| Headers | declarativeNetRequest | Inyección DOM |
| Proof of Work | Web Worker + cache | ❌ No implementado |
| Chat Requirements | ✅ Sí | ❌ No |
| Device ID | localStorage persistente | ❌ No persistente |
| Upload de archivos | ✅ Sistema completo | ❌ No implementado |

## Próximos Pasos

1. Añadir reglas `declarativeNetRequest` al manifest
2. Implementar Web Worker para proof-of-work
3. Añadir llamada a `/sentinel/chat-requirements`
4. Gestionar Device ID en localStorage
5. Implementar upload de archivos
