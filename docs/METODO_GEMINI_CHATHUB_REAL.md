# Método Real de ChatHub para Gemini

## Código Extraído de ChatHub (premium-CHh0JHCP.js)

### 1. Función Principal: `xgt()` - Obtener Parámetros

```javascript
async function xgt(){
    const e = await fn("https://gemini.google.com/", {
        responseType:"text"
    });

    const t = lM("SNlM0e", e);  // Extraer token AT
    const n = lM("cfb2h", e);    // Extraer BL value

    return {
        atValue: t,    // Token AT (usado para autenticación)
        blValue: n     // BL value (build label / versión)
    }
}

// Función helper para extraer valores con regex
function lM(e, t){
    const r = new RegExp(`"${e}":"([^"]+)"`).exec(t);
    return r == null ? void 0 : r[1]
}
```

**¿Qué hace?**
- Hace un GET a `https://gemini.google.com/`
- Extrae del HTML dos valores usando regex:
  - `SNlM0e`: El token AT (autenticación)
  - `cfb2h`: El BL (build label / versión del servidor)

---

### 2. Clase Principal: `Igt` (Gemini Client)

```javascript
class Igt extends pu {
    constructor() {
        super(...arguments);
        vi(this, "conversationContext");
    }

    async doSendMessage(n) {
        // Primera vez: inicializar contexto
        this.conversationContext || (
            this.conversationContext = {
                requestParams: await xgt(),           // Obtener AT y BL
                contextIds: ["","",""]                // IDs vacíos para nueva conversación
            }
        );

        const {requestParams: r, contextIds: i} = this.conversationContext;

        // Si hay imagen, subirla primero
        let o;
        n.image && (o = await this.uploadImage(n.image));

        // Construir payload
        const a = [
            null,
            JSON.stringify([
                [
                    n.prompt,                          // El prompt del usuario
                    0,                                 // Parámetro fijo
                    null,                              // Parámetro fijo
                    o ? [[[o, 1], n.image.name]] : []  // Array de imágenes (si hay)
                ],
                null,                                  // Parámetro fijo
                i                                      // Los 3 IDs de conversación
            ])
        ];

        // Crear form data
        const s = new URLSearchParams({
            "f.req": JSON.stringify(a)
        });

        // Agregar token AT si existe
        r.atValue && s.set("at", r.atValue);

        // Hacer la petición con función `fn()`
        const l = await fn(
            "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate",
            {
                method: "POST",
                signal: n.signal,
                query: {                               // Query params en URL
                    bl: r.blValue,                     // BL obtenido de xgt()
                    _reqid: Agt(),                     // Random ID
                    rt: "c"                            // Parámetro fijo
                },
                body: s,                               // URLSearchParams
                parseResponse: d => d                  // Retornar respuesta cruda
            }
        );

        // Parsear respuesta
        const {text: u, ids: c} = Cgt(l);

        // Actualizar IDs de conversación para siguiente mensaje
        this.conversationContext.contextIds = c;

        // Enviar eventos
        n.onEvent({
            type: "UPDATE_ANSWER",
            data: {
                parts: [{type: "text", text: u}]
            }
        });
        n.onEvent({type: "DONE"});
    }

    resetConversation() {
        this.conversationContext = void 0;
    }

    get supportsImageInput() {
        return !0;
    }
}
```

---

### 3. Función Helper: Generar Request ID

```javascript
function Agt() {
    return Math.floor(Math.random() * 9e5) + 1e5;  // Random entre 100000-999999
}
```

---

### 4. Parser de Respuesta

```javascript
function Cgt(e) {
    // La respuesta viene en múltiples líneas
    for (const t of e.split('\n')) {
        try {
            return kgt(t);  // Intentar parsear cada línea
        } catch {}
    }
    throw new pn("Failed to parse Gemini response", xn.UNKOWN_ERROR);
}

function kgt(e) {
    const t = JSON.parse(e);
    const n = JSON.parse(t[0][2]);

    if (!n)
        throw new pn("Failed to load Gemini response", xn.BARD_EMPTY_RESPONSE);

    const r = n[4][0];
    let i = r[1][0];  // Texto de la respuesta

    // Procesar imágenes en la respuesta (regex para reemplazar placeholders)
    const Tgt = /\[Image of [^\]]+\]/g;
    try {
        const o = r[12][1] || [];  // Array de imágenes
        let a = 0;
        i = i.replace(Tgt, s => {
            const l = o[a++];
            if (!l) return s;
            const u = l[0][4];  // Alt text
            const c = l[0][0][0];  // Thumbnail URL
            const d = l[1][0][0];  // Full image URL
            return `[![${u}](${c})](${d})`;  // Markdown image
        });
    } catch {}

    return {
        text: i,
        ids: [...n[1], r[0]]  // Nuevos IDs para siguiente mensaje
    };
}
```

---

## Puntos Clave

### ✅ LO QUE HACE CHATHUB (y funciona)

1. **NO calcula el token AT manualmente**
   - Hace un GET a `https://gemini.google.com/`
   - Extrae `SNlM0e` del HTML con regex
   - Lo usa directamente

2. **Usa la función `fn()`**
   - Esta función es un wrapper de fetch
   - Probablemente maneja cookies automáticamente
   - Usa `credentials: 'include'` implícitamente

3. **IDs de conversación simples**
   - Primera vez: `["","",""]` (strings vacíos)
   - Luego: los IDs que devuelve el servidor en la respuesta

4. **Payload exacto**
   ```javascript
   [
       null,
       JSON.stringify([
           [prompt, 0, null, imageArray],
           null,
           [conversationId, responseId, choiceId]  // o ["","",""]
       ])
   ]
   ```

5. **Query params en URL**
   ```javascript
   ?bl=${blValue}&_reqid=${randomId}&rt=c
   ```

---

## ❌ LO QUE ESTABA HACIENDO MAL

1. **Calculaba el token AT manualmente**
   - Usaba SAPISID de cookies
   - Calculaba SAPISIDHASH con SHA-1
   - ChatHub NO hace esto, extrae `SNlM0e` del HTML

2. **Generaba IDs aleatorios**
   - Usaba `c_${randomHex(16)}`
   - ChatHub usa `["","",""]` para nueva conversación

3. **Headers incorrectos**
   - Agregaba headers manualmente
   - ChatHub deja que `fn()` maneje todo

---

## 🔍 La Función `fn()`

ChatHub usa una función llamada `fn()` que probablemente es algo como:

```javascript
async function fn(url, options) {
    const {query, body, signal, parseResponse} = options;

    // Construir URL con query params
    const urlWithQuery = query
        ? `${url}?${new URLSearchParams(query).toString()}`
        : url;

    // Hacer fetch con cookies incluidas
    const response = await fetch(urlWithQuery, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            // Otros headers necesarios...
        },
        body: body ? body.toString() : undefined,
        signal: signal,
        credentials: 'include'  // ← IMPORTANTE: incluye cookies automáticamente
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    return parseResponse ? parseResponse(text) : text;
}
```

---

## 📝 Implementación Correcta para Nuestra Extensión

```javascript
async function sendToGeminiDirect(prompt) {
    console.log('[Gemini] Enviando prompt...');

    try {
        // 1. Obtener parámetros de Gemini
        const htmlResponse = await fetch('https://gemini.google.com/', {
            credentials: 'include'
        });
        const html = await htmlResponse.text();

        // 2. Extraer token AT y BL del HTML
        const atMatch = /"SNlM0e":"([^"]+)"/.exec(html);
        const blMatch = /"cfb2h":"([^"]+)"/.exec(html);

        if (!atMatch || !blMatch) {
            throw new Error('No se pudieron extraer los tokens de Gemini');
        }

        const at = atMatch[1];
        const bl = blMatch[1];

        console.log('[Gemini] Token AT:', at.substring(0, 20) + '...');
        console.log('[Gemini] BL:', bl);

        // 3. Construir payload
        const payload = [
            null,
            JSON.stringify([
                [prompt, 0, null, []],  // Sin imágenes por ahora
                null,
                ["", "", ""]            // Nueva conversación
            ])
        ];

        // 4. Crear form data
        const formData = new URLSearchParams({
            'f.req': JSON.stringify(payload),
            'at': at
        });

        // 5. Generar request ID aleatorio
        const reqId = Math.floor(Math.random() * 900000) + 100000;

        // 6. Hacer petición
        const url = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${bl}&_reqid=${reqId}&rt=c`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formData.toString(),
            credentials: 'include'  // ← CLAVE: incluir cookies
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Gemini] Error:', errorText);
            throw new Error(`Gemini error: ${response.status}`);
        }

        // 7. Parsear respuesta
        const text = await response.text();
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.trim().length === 0) continue;

            try {
                const parsed = JSON.parse(line);
                const data = JSON.parse(parsed[0][2]);

                if (!data) continue;

                const content = data[4][0];
                const responseText = content[1][0];

                console.log('[Gemini] Respuesta:', responseText);
                return responseText;

            } catch (parseError) {
                // Continuar con siguiente línea
                continue;
            }
        }

        throw new Error('No se pudo parsear la respuesta de Gemini');

    } catch (error) {
        console.error('[Gemini] Error:', error);
        throw error;
    }
}
```

---

## 🎯 Diferencias Clave

| Aspecto | Mi Método Anterior | ChatHub (Real) |
|---------|-------------------|----------------|
| Token AT | Calculado con SAPISID + SHA-1 | Extraído de HTML con regex (`SNlM0e`) |
| BL Value | Extraído con fetch + regex | Extraído de HTML con regex (`cfb2h`) |
| IDs conversación | Generados aleatoriamente `c_xxx` | Strings vacíos `["","",""]` |
| Cookies | Intentaba leer cookies manualmente | `credentials: 'include'` automático |
| Headers | Agregados manualmente | Solo Content-Type |
| Función fetch | fetch() directa | Wrapper `fn()` que maneja todo |

---

## ✅ Resumen

**ChatHub NO usa el método complicado de SAPISID + proof-of-work**

En su lugar:
1. Hace GET a `https://gemini.google.com/`
2. Extrae `SNlM0e` (token AT) del HTML
3. Extrae `cfb2h` (BL) del HTML
4. Hace POST con `credentials: 'include'`
5. Usa IDs vacíos `["","",""]` para nueva conversación

**Es mucho más simple de lo que pensábamos!**
