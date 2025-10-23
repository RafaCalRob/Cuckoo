# 🔍 Último Debug - Error 400 Persistente

## 📊 Estado Actual

### ✅ Lo Que Funciona
- Peticiones se hacen desde background ✅
- BL se obtiene dinámicamente ✅
- Token AT se genera correctamente ✅
- Payload es idéntico a ChatHub ✅
- Headers son mínimos (como ChatHub) ✅

### ❌ Lo Que Falla
- Gemini devuelve 400 Bad Request

---

## 🔬 Comparación Exacta

### Tu Extensión:
```javascript
URL: /_/BardChatUi/data/.../StreamGenerate?bl=boq_assistant-bard-web-server_20251015.03_p2&_reqid=433358&rt=c

Payload: f.req=[null,"[[\"test\",0,null,[]],null,[\"\",\"\",\"\"]]"]

Token AT: pAhiVkk721v9qP7VSKQrFMSNqg8:1760988372484

Headers:
  Content-Type: application/x-www-form-urlencoded;charset=UTF-8
  (Chrome agrega cookies automáticamente)
```

### ChatHub (funciona):
```javascript
URL: /_/BardChatUi/data/.../StreamGenerate?bl=boq_assistant-bard-web-server_20251015.03_p2&_reqid=727397&rt=c

Payload: f.req=[null,"[[\"Test\",0,null,[]],null,[\"\",\"\",\"\"]]"]

Token AT: AGElXSPZ3xpPj6b4NeIapZNvUpf8:1760988033753

Headers:
  Content-Type: application/x-www-form-urlencoded;charset=UTF-8
  origin: chrome-extension://iaakpnchhognanibcahlpcplchdfmgma
```

**Diferencias:**
1. Prompt: "test" vs "Test" (irrelevante)
2. _reqid: diferente (normal, es aleatorio)
3. Token AT: diferente (normal, cambia con timestamp)
4. Origin: auto vs chrome-extension (Chrome debería agregarlo automáticamente)

**NO HAY diferencias significativas.**

---

## 🎯 Necesito Ver

### En Network → StreamGenerate → Pestaña "Response"

**Copia el contenido completo del Response body del error 400.**

Probablemente es algo como:
```json
{
  "error": {
    "code": 400,
    "message": "Invalid argument",
    "details": "..."
  }
}
```

O:
```
)]}'

103
[["er",null,null,null,null,400,...]]
```

---

## 🧪 Prueba con Log Mejorado

1. **Recarga la extensión**
2. **Limpia Service Worker Console**
3. **Envía "test"**
4. **Copia TODOS los logs**

Ahora verás:
```
[Gemini Direct] ❌ Error response completo: ...
[Gemini Direct] Comparación:
  Mi payload: ...
  Mi AT: ...
```

---

## 💡 Posibles Causas Restantes

### 1. Formato de encoding
Quizás URLSearchParams codifica algo diferente.

**ChatHub codifica:** `%5Bnull%2C%22%5B%5B%5C%22Test%5C%22...`
**Yo codifico:** (necesito ver el raw request)

### 2. Parámetro faltante
Quizás hay algún parámetro que no estoy viendo en el cURL.

### 3. Cookie específica
Quizás necesito una cookie específica que no se está enviando.

### 4. Rate limiting
Quizás Gemini está bloqueando por intentos repetidos.

### 5. Validación server-side
Quizás Gemini valida algo del origen de la extensión.

---

## 🔬 Test Alternativo

**Prueba esto en Service Worker Console:**

```javascript
// Copiar y pegar esto en Service Worker Console
(async () => {
    const at = 'TU_TOKEN_AT_AQUI';
    const bl = 'boq_assistant-bard-web-server_20251015.03_p2';
    const reqId = 123456;

    const apiUrl = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${bl}&_reqid=${reqId}&rt=c`;

    const payload = [["test", 0, null, []], null, ["", "", ""]];

    const formData = new URLSearchParams();
    formData.append('f.req', JSON.stringify([null, JSON.stringify(payload)]));
    formData.append('at', at);

    console.log('Testing fetch...');
    console.log('f.req:', formData.get('f.req'));
    console.log('at:', formData.get('at'));

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: formData.toString(),
        credentials: 'include'
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
})();
```

Reemplaza `TU_TOKEN_AT_AQUI` con un token AT que generes ejecutando esto primero:

```javascript
// Generar token AT manualmente
(async () => {
    const cookies = await chrome.cookies.getAll({ domain: '.google.com' });
    const sapisidCookie = cookies.find(c => c.name === 'SAPISID' || c.name === '__Secure-3PAPISID');
    const sapisid = sapisidCookie.value;

    const timestamp = Date.now();
    const origin = 'https://gemini.google.com';
    const message = `${timestamp} ${sapisid} ${origin}`;

    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBinary = String.fromCharCode(...hashArray);
    const hashBase64 = btoa(hashBinary);
    const hashBase64url = hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const at = `${hashBase64url}:${timestamp}`;

    console.log('Token AT:', at);
})();
```

---

## 📋 Checklist de Datos Necesarios

- [ ] Response body del error 400 (completo)
- [ ] Logs del Service Worker (después de recargar)
- [ ] (Opcional) Resultado del test manual arriba

Con el Response body sabré exactamente qué está rechazando Gemini.

---

**¡Recarga la extensión y comparte los logs + el Response body del error 400!** 🔍
