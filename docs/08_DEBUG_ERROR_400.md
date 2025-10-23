# 🐛 Debug Error 400 - Comparación con ChatHub

## ✅ Progreso Actual

**¡EXCELENTE!** La petición **SÍ se está haciendo** desde background.

Esto significa que:
- ✅ Arquitectura correcta (no inyección)
- ✅ Cookies funcionan (SAPISID presente)
- ✅ Petición llega a Gemini
- ❌ Payload incorrecto (error 400)

---

## 🔧 Mejoras Aplicadas

### 1. BL Dinámico
**ANTES:** BL hardcoded (desactualizado)
```javascript
const bl = 'boq_assistant-bard-web-server_20251015.03_p2';
```

**AHORA:** BL obtenido dinámicamente
```javascript
async function getGeminiBL() {
    const response = await fetch('https://gemini.google.com/app');
    const html = await response.text();
    const match = html.match(/boq_assistant-bard-web-server_[\d.]+_[\w\d]+/);
    return match[0];
}
```

### 2. Headers Mejorados
Agregados:
- `X-Same-Domain: 1`
- `User-Agent`
- `Accept`
- `Accept-Language`
- `Referer: https://gemini.google.com/app`

### 3. Logs Detallados
Ahora muestra:
- `f.req` completo
- `at` completo
- BL obtenido

---

## 🧪 Prueba Actualizada

### Paso 1: Recarga
```bash
chrome://extensions/ → Multi-Chat AI → Recargar
```

### Paso 2: Service Worker Console
```bash
chrome://extensions/ → Multi-Chat AI → "Service Worker"
```

### Paso 3: Envía "test"
```bash
index.html → "test" → Gemini → Enviar
```

### Paso 4: Observa los NUEVOS logs

**Deberías ver:**
```javascript
[Gemini BL] Obteniendo BL desde gemini.google.com...
[Gemini BL] ✓ BL encontrado: boq_assistant-bard-web-server_XXXXXXXX_XX
[Gemini Direct] Token AT generado: ...
[Gemini Direct] BL obtenido: boq_assistant-bard-web-server_...
[Gemini Direct] URL: https://gemini.google.com/_/BardChatUi/...
[Gemini Direct] Payload: [["test", 0, null, []], null, ["", "", ""]]
[Gemini Direct] Form data f.req: [null,"[[\"test\",0,null,[]],null,[\"\",\"\",\"\"]]"]
[Gemini Direct] Form data at: AGElXSNxbKY5uYcGF9sTA5HJPdTj:1760987654321
[Gemini Direct] Enviando petición...
[Gemini Direct] Response status: ???
```

---

## 📊 Comparación con ChatHub

### Necesito que hagas esto:

1. **Abre ChatHub**
2. **Envía "test" a Gemini**
3. **En Network de ChatHub**, busca `StreamGenerate`
4. **Click derecho → Copy → Copy as cURL**
5. **Pégamelo aquí**

O alternativamente:

### En ChatHub Network → StreamGenerate:

**Pestaña "Payload":**
- Copia el valor de `f.req`
- Copia el valor de `at`

**Pestaña "Headers":**
- Copia todos los `Request Headers`

---

## 🔍 Lo Que Voy a Comparar

### Mi Extensión:
```javascript
// f.req
[null,"[[\"test\",0,null,[]],null,[\"\",\"\",\"\"]]"]

// at
AGElXSNxbKY5uYcGF9sTA5HJPdTj:1760987654321

// URL
https://gemini.google.com/_/BardChatUi/data/.../StreamGenerate?bl=...&_reqid=123456&rt=c
```

### ChatHub (necesito tus datos):
```javascript
// f.req
???

// at
???

// URL
???
```

---

## 🎯 Posibles Causas del 400

### 1. Formato de f.req
**Posible problema:** Doble codificación JSON

**Mi código:**
```javascript
JSON.stringify([null, JSON.stringify(requestPayload)])
```

**Alternativa:**
```javascript
JSON.stringify(requestPayload)
```

### 2. IDs de conversación
**Mi código:** `["", "", ""]`

**ChatHub puede usar:** `null` o formato diferente

### 3. Headers faltantes
Puede que necesite:
- `X-Goog-BatchExecute-Bgr`
- `X-Goog-AuthUser`
- Otros headers específicos

### 4. BL incorrecto
Aunque ahora es dinámico, puede que el patrón regex no lo capture correctamente.

---

## 🚀 Pasos Siguientes

1. **Recarga la extensión** (para obtener BL dinámico)
2. **Envía "test"**
3. **Comparte los logs completos** del Service Worker
4. **Comparte el cURL de ChatHub** (o payload/headers)

Con esos datos puedo hacer el ajuste final.

---

## 📋 Checklist

Antes de continuar:
- [ ] Extensión recargada
- [ ] Service Worker Console abierto
- [ ] Enviaste "test"
- [ ] Copiaste logs del Service Worker
- [ ] (Opcional) Copiaste cURL de ChatHub

---

**Estamos MUY cerca. Solo necesito comparar el payload exacto.** 🚀
