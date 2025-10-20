# 🔧 Guía de Debugging - Multi-Chat AI

## Problema: "No se encontraron pestañas abiertas de las IAs"

### Paso 1: Recargar la Extensión
1. Ve a `chrome://extensions`
2. Busca "Multi-Chat AI"
3. Haz clic en el icono de **recarga** (⟳)
4. Verifica que no haya errores (debe aparecer sin advertencias)

### Paso 2: Abrir la Consola del Service Worker
1. En `chrome://extensions`, busca "Multi-Chat AI"
2. Haz clic en **"service worker"** (enlace azul)
3. Se abrirá una ventana de DevTools
4. Verás logs cada 5 segundos mostrando **todas las pestañas abiertas**

Ejemplo de lo que deberías ver:
```
===== TODAS LAS PESTAÑAS ABIERTAS =====
Tab 123: https://chat.openai.com/
Tab 124: https://gemini.google.com/app
Tab 125: https://claude.ai/chat/new
======================================
```

### Paso 3: Abrir las Pestañas de las IAs
1. Haz clic en el icono de la extensión
2. Haz clic en **"Abrir IAs"**
3. Espera 5-10 segundos
4. Verifica en la consola del service worker que aparecen las pestañas con las URLs:
   - `https://chat.openai.com/`
   - `https://gemini.google.com/`
   - `https://claude.ai/`

### Paso 4: Verificar Logs al Enviar Prompt
1. Abre la extensión (`index.html`)
2. Abre DevTools (F12) en la página de la extensión
3. Escribe un prompt y haz clic en "Enviar"
4. En la consola deberías ver:
   ```
   Abriendo pestañas de IAs...
   Pestaña chatgpt abierta: 123 https://chat.openai.com
   ...
   ```

5. En la consola del **service worker** deberías ver:
   ```
   Background recibió mensaje: SEND_PROMPT
   Buscando pestañas para: ['chatgpt', 'gemini', 'claude']
   Buscando ChatGPT con patrón: *://chat.openai.com/*
   ✓ Pestaña ChatGPT encontrada: 123 https://chat.openai.com/
   ✓ Pestañas encontradas, enviando prompts...
   ```

### Paso 5: Verificar Content Scripts en las Páginas de IAs
1. Ve a la pestaña de ChatGPT
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Deberías ver:
   ```
   Content script de Multi-Chat AI inyectado
   Content script listo para recibir prompts
   ```

5. Cuando envíes un prompt, verás:
   ```
   Content script recibió mensaje: {type: 'INJECT_PROMPT', ...}
   Inyectando prompt en chatgpt: [tu prompt]
   Campo de entrada encontrado: textarea#prompt-textarea
   Insertando texto en elemento: TEXTAREA
   Texto insertado
   Buscando botón de envío...
   Botón de envío encontrado: button[data-testid="send-button"]
   Haciendo clic en el botón de envío...
   ```

### Problemas Comunes

#### ❌ "Pestañas encontradas para ChatGPT: 0"
**Solución:** La URL no coincide con el patrón.
- Asegúrate de estar en `https://chat.openai.com/` (no `chatgpt.com`)
- Para Claude, debe ser `https://claude.ai/` (con subdominio)
- Para Gemini, debe ser `https://gemini.google.com/`

#### ❌ "Timeout esperando el selector"
**Solución:** Los selectores CSS han cambiado.
- Abre DevTools en la página de la IA
- Inspecciona el campo de texto
- Busca el selector correcto (class, id, data-attributes)
- Actualiza `content_script.js` con el nuevo selector

#### ❌ "Error al comunicarse con la página"
**Solución:** El content script no se inyectó correctamente.
- Verifica los permisos en `manifest.json`
- Recarga la extensión
- Recarga la página de la IA (F5)

### URLs Correctas

| IA | URL Correcta |
|----|--------------|
| ChatGPT | `https://chat.openai.com` o `https://chat.openai.com/` |
| Gemini | `https://gemini.google.com` |
| Claude | `https://claude.ai` |
| Meta AI | `https://www.meta.ai` |
| Grok | `https://x.com/i/grok` |
| Perplexity | `https://www.perplexity.ai` |

### Patrones de URL en el Código

En `background.js`:
```javascript
chatgpt: '*://chat.openai.com/*'
gemini: '*://gemini.google.com/*'
claude: '*://*.claude.ai/*'
```

**IMPORTANTE:** El patrón debe coincidir **exactamente** con la URL de la pestaña abierta.

### Testing Manual

1. Abre una pestaña: `https://chat.openai.com`
2. En la consola del service worker, escribe:
   ```javascript
   chrome.tabs.query({url: '*://chat.openai.com/*'}, (tabs) => {
       console.log('Pestañas encontradas:', tabs);
   });
   ```
3. Si devuelve un array vacío `[]`, el patrón no coincide
4. Si devuelve pestañas, el patrón es correcto

### Desactivar Debug Mode

Una vez que todo funcione, comenta esta línea en `background.js`:
```javascript
// setInterval(() => {
//     debugListAllTabs();
// }, 5000);
```

---

## 📝 Reportar Problemas

Si después de seguir estos pasos sigue sin funcionar:

1. Copia **todos** los logs de:
   - Consola del service worker
   - Consola de la extensión (index.html)
   - Consola de la página de la IA (ej: ChatGPT)

2. Incluye:
   - Versión de Chrome
   - URL exacta donde tienes abierta cada IA
   - Capturas de pantalla si es posible
