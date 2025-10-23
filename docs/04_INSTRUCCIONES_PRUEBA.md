# 🧪 Instrucciones de Prueba - Gemini con IDs de Conversación

## ✅ Cambios Implementados

### 1. Función `extractGeminiConversationIds()`
**Ubicación:** `content_script_direct_api.js` líneas 638-726

**Qué hace:**
- Busca IDs de conversación existentes en la página de Gemini
- Busca en 3 lugares:
  1. **Scripts inline** - Busca patrones `"c_xxxxx"`, `"r_xxxxx"`, `"rc_xxxxx"`
  2. **WIZ_global_data** - Estructura global de Google
  3. **URL parameters** - Si hay conversación activa

**Resultado:**
- Si encuentra IDs → Los guarda en `state.gemini` para reutilizarlos
- Si NO encuentra → Usa strings vacíos (nueva conversación)

### 2. Flujo Completo de IDs

```
Primera Petición:
┌─────────────────────────────────────────┐
│ 1. extractGeminiConversationIds()      │
│    → Busca IDs en página                │
│    → No encuentra (nueva conversación)  │
│    → state.gemini = {c: "", r: "", rc: ""}│
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 2. sendToGeminiAPI()                    │
│    → Payload: [prompt, 0, null, []]    │
│    →          null                       │
│    →          ["", "", ""]              │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 3. readGeminiStream()                   │
│    → Lee respuesta de Gemini            │
│    → Extrae IDs de la respuesta:        │
│      • c_7ecdb4e2d38ad352               │
│      • r_eb53b148bf264966               │
│      • rc_598273294f9fb79c              │
│    → Actualiza state.gemini             │
└─────────────────────────────────────────┘

Segunda Petición (misma conversación):
┌─────────────────────────────────────────┐
│ 1. extractGeminiConversationIds()      │
│    → state ya tiene IDs                 │
│    → No busca (ya están cargados)       │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 2. sendToGeminiAPI()                    │
│    → Payload: [prompt, 0, null, []]    │
│    →          null                       │
│    →          ["c_7ec...", "r_eb5...", "rc_598..."]│
└─────────────────────────────────────────┘
```

---

## 🚀 Pasos para Probar

### Paso 1: Recargar la Extensión
```
1. Ve a chrome://extensions/
2. Encuentra "Multi-Chat AI"
3. Click en el icono de recargar (⟳)
```

### Paso 2: Abrir Gemini
```
1. Abre una pestaña NUEVA
2. Ve a: https://gemini.google.com/app
3. Asegúrate de estar logueado
```

### Paso 3: Abrir Console y Network
```
1. En la pestaña de Gemini, presiona F12
2. Ve a la pestaña "Console"
3. Ve a la pestaña "Network" (en la misma ventana)
4. Deja ambas abiertas
```

### Paso 4: Limpiar Console
```
En Console, click en el icono de "Clear console" (🚫)
```

### Paso 5: Enviar Primer Mensaje
```
1. Abre la extensión (click en el icono)
2. Escribe: "Test 1"
3. Selecciona SOLO Gemini
4. Click "Enviar"
```

### Paso 6: Observar Logs

**En Console deberías ver:**
```javascript
[Multi-Chat AI Direct API] Cargado
[Multi-Chat AI Direct API] Mensaje recibido: {type: 'SEND_PROMPT_DIRECT_API', ...}
[Direct API] Tipo de IA detectado: gemini
[Gemini API] Enviando prompt...
[Gemini API] BL encontrado: boq_assistant-bard-web-server_...
[Gemini API] at token: AGElXSNxbKY5uYcGF9sTA5HJPdTj:...
[Gemini API] Extrayendo IDs de conversación...
[Gemini API] No se encontraron IDs - Nueva conversación (se usarán strings vacíos)
[Gemini API] URL: https://gemini.google.com/_/BardChatUi/data/.../StreamGenerate?bl=...&_reqid=...&rt=c
[Gemini API] Payload: [["Test 1", 0, null, []], null, ["", "", ""]]
[Gemini API] Enviando a StreamGenerate...
[Gemini API] Response status: 200  ← ✅ ESTO ES LO IMPORTANTE
[Gemini API] Streaming: 50 chars
[Gemini API] Streaming: 120 chars
[Gemini API] ✓ Enviado exitosamente
```

**En Network deberías ver:**
```
▶ StreamGenerate?bl=...     POST    200    text/plain
```

---

## 📊 Escenarios de Prueba

### ✅ Escenario 1: Nueva Conversación (Primera Vez)
**Estado inicial:**
```javascript
state.gemini = {
    conversationId: null,
    responseId: null,
    choiceId: null
}
```

**Payload enviado:**
```javascript
[["Test 1", 0, null, []], null, ["", "", ""]]
```

**Resultado esperado:**
- Status: 200 ✅
- Respuesta de Gemini aparece en la extensión
- Console muestra: "No se encontraron IDs - Nueva conversación"

**Después de la respuesta:**
```javascript
state.gemini = {
    conversationId: "c_7ecdb4e2d38ad352",
    responseId: "r_eb53b148bf264966",
    choiceId: "rc_598273294f9fb79c"
}
```

---

### ✅ Escenario 2: Conversación Existente
**Si ya enviaste un mensaje antes, envía otro:**

**Payload del segundo mensaje:**
```javascript
[["Test 2", 0, null, []], null, ["c_7ecdb4e2d38ad352", "r_eb53b148bf264966", "rc_598273294f9fb79c"]]
```

**Resultado esperado:**
- Status: 200 ✅
- Gemini responde en contexto del mensaje anterior
- Console muestra: "IDs extraídos: {conversationId: c_xxx, ...}"

---

### ✅ Escenario 3: Conversación Abierta en Gemini
**Si ya tienes una conversación abierta en Gemini:**

1. Abre Gemini manualmente
2. Envía algunos mensajes normalmente (sin extensión)
3. LUEGO usa la extensión para enviar un mensaje

**Resultado esperado:**
- `extractGeminiConversationIds()` encuentra los IDs en la página
- Payload usa esos IDs
- El mensaje se agrega a la conversación existente

---

## ❌ Si Ves Error 400

### Logs de Error:
```javascript
[Gemini API] Response status: 400
[Gemini API] ❌ Error response: )]}'\n\n103\n[["er",null,null,null,null,400...
[Gemini API] ⚠️ Error 400 - Payload incorrecto o parámetros inválidos
[Gemini API] BL usado: boq_assistant-bard-web-server_...
[Gemini API] Payload enviado: [...]
```

### Comparte estos datos:
1. **BL usado:** (valor completo)
2. **Payload enviado:** (valor completo)
3. **at token:** (primeros 30 caracteres)
4. **Error response:** (primeras 500 caracteres)

---

## 🔍 Debugging Avanzado

### Ver el Token 'at' Completo
En Console de Gemini, ejecuta:
```javascript
// Ver cookies
document.cookie.split(';').filter(c => c.includes('SAPISID'))

// Ver token generado (necesitas esperar a que se genere)
// Aparece en los logs como: "at token: AGElXSNxbKY5uYcGF9sTA5HJPdTj:..."
```

### Ver el Estado Actual
```javascript
// Esto NO funcionará porque 'state' está en el content script
// Pero puedes ver los logs que muestran el estado
```

### Inspeccionar Payload en Network
1. Ve a Network
2. Click en "StreamGenerate"
3. Ve a la pestaña "Payload"
4. Busca "f.req"
5. Deberías ver: `[null,"[[\"Test\",0,null,[]],null,[\"c_xxx\",\"r_xxx\",\"rc_xxx\"]]"]`

---

## 🎯 Resultados Esperados vs Actuales

### ✅ Caso Exitoso (200)

**Network:**
```
StreamGenerate?bl=...    POST    200    text/plain    ~2-5s
```

**Console:**
```
[Gemini API] Response status: 200
[Gemini API] Streaming: ...
[Gemini API] ✓ Enviado exitosamente
```

**Extensión:**
Deberías ver la respuesta de Gemini aparecer en tiempo real en la columna correspondiente.

---

### ❌ Caso Error (400)

**Network:**
```
StreamGenerate?bl=...    POST    400    text/plain    ~100ms
```

**Console:**
```
[Gemini API] Response status: 400
[Gemini API] ❌ Error response: )]}'\n\n103\n[["er",null,null,null,null,400...
```

**Extensión:**
```
Error: Gemini API error: 400 - ...
```

---

## 📋 Checklist de Verificación

Antes de reportar un error, verifica:

- [ ] La extensión está recargada (chrome://extensions → Recargar)
- [ ] Gemini está abierto en una pestaña (https://gemini.google.com/app)
- [ ] Estás logueado en Google
- [ ] Console y Network están abiertos
- [ ] Enviaste el prompt desde la extensión
- [ ] Tienes cookies SAPISID (document.cookie incluye "SAPISID")

---

## 🔄 Comparación con ChatHub

### ChatHub (Funciona):
```javascript
// Payload de ChatHub
f.req = [null, "[[\"test\",0,null,[]],null,[\"c_7ecdb4e2d38ad352\",\"r_eb53b148bf264966\",\"rc_598273294f9fb79c\"]]"]

// Token at
at = "AGElXSNxbKY5uYcGF9sTA5HJPdTj:1760984967143"

// URL
https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20251015.03_p2&_reqid=769497&rt=c
```

### Mi Extensión (Debería Funcionar Ahora):
```javascript
// Payload de mi extensión (primera vez)
f.req = [null, "[[\"Test 1\",0,null,[]],null,[\"\",\"\",\"\"]]"]

// Payload de mi extensión (segunda vez, con IDs extraídos)
f.req = [null, "[[\"Test 2\",0,null,[]],null,[\"c_7ecdb4e2d38ad352\",\"r_eb53b148bf264966\",\"rc_598273294f9fb79c\"]]"]

// Token at
at = "AGElXSNxbKY5uYcGF9sTA5HJPdTj:1760987123456"  // (timestamp diferente)

// URL (idéntica estructura)
https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20251015.03_p2&_reqid=123456&rt=c
```

**Diferencias:**
1. **Prompt:** "test" vs "Test 1" (irrelevante)
2. **IDs:** ChatHub tiene IDs reales, mi extensión usa `["", "", ""]` en primera petición (correcto para nueva conversación)
3. **Timestamp:** Diferente pero correcto

**Todo lo demás es idéntico.**

---

## ✅ Resumen de Implementación

**Archivos modificados:**
- `content_script_direct_api.js`
  - Líneas 638-726: Nueva función `extractGeminiConversationIds()`
  - Línea 363: Llamada a la función antes de enviar el prompt
  - Líneas 474-498: Extracción de IDs desde la respuesta (ya existía)

**Lógica:**
1. Antes de enviar → Busca IDs en la página
2. Si no encuentra → Usa strings vacíos (nueva conversación)
3. Después de recibir → Guarda los IDs retornados
4. Próximo mensaje → Reutiliza los IDs guardados

**Estado:**
✅ Implementación completa
🧪 Listo para pruebas

---

## 🎉 Próximos Pasos

1. **Prueba con el Escenario 1** (nueva conversación)
2. **Verifica que funcione** (status 200)
3. **Comparte los logs completos** si hay error 400
4. **Prueba Escenario 2** (segundo mensaje en misma conversación)

**Si todo funciona:**
- Gemini debería responder exitosamente
- Los mensajes subsecuentes deberían mantener el contexto
- Deberías ver las peticiones HTTP en Network

**Si falla:**
- Comparte los logs de Console
- Comparte el payload de Network
- Comparte el error response completo

¡Prueba y cuéntame qué pasa! 🚀
