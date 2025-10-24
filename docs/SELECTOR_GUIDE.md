# Guía de Actualización de Selectores

Esta guía te ayudará a actualizar los selectores CSS cuando las páginas de las IAs cambien su estructura.

## 🎯 ¿Por qué se rompen los selectores?

Los selectores CSS que usamos para identificar elementos en las páginas web pueden dejar de funcionar cuando:
- Las IAs actualizan su interfaz
- Cambian la estructura HTML de sus páginas
- Modifican los nombres de clases CSS o atributos

## 🔍 Cómo Encontrar los Nuevos Selectores

### Paso 1: Abrir DevTools

1. Abre la página de la IA que no está funcionando (ChatGPT, Gemini o Claude)
2. Presiona `F12` o `Cmd+Option+I` para abrir las herramientas de desarrollador
3. Haz clic en el ícono de "Selector de elementos" (flecha en esquina superior izquierda)

### Paso 2: Identificar Cada Elemento

Necesitas encontrar selectores para 4 elementos:

#### 1. Campo de Entrada (inputField)
- Haz clic en el textarea o div donde escribes el prompt
- En el inspector, busca atributos únicos:
  - `id="..."`
  - `class="..."`
  - `data-*="..."`
  - `role="textbox"`
  - `contenteditable="true"`

**Ejemplos de selectores válidos:**
```javascript
'#prompt-textarea'                          // Por ID
'textarea[placeholder*="Message"]'          // Por atributo
'div[contenteditable="true"][role="textbox"]' // Por múltiples atributos
'.input-area textarea'                      // Por clase padre
```

#### 2. Botón de Envío (sendButton)
- Haz clic en el botón "Send" o "Enviar"
- Busca atributos únicos del botón

**Ejemplos de selectores válidos:**
```javascript
'button[data-testid="send-button"]'         // Por data-testid
'button[aria-label*="Send"]'                // Por aria-label
'button.send-button'                        // Por clase
'button:has(svg[data-icon="send"])'         // Por contenido
```

#### 3. Contenedor de Respuestas (responseContainer)
- Desplázate hasta una respuesta de la IA
- Inspecciona el contenedor que rodea el texto de la respuesta

**Ejemplos de selectores válidos:**
```javascript
'.markdown'                                 // Por clase
'[data-message-author-role="assistant"]'    // Por atributo
'.response-content'                         // Por clase específica
'.model-response'                           // Por clase de modelo
```

#### 4. Última Respuesta (lastResponse)
- Similar al anterior, pero debe apuntar específicamente a la última respuesta
- Usa `:last-of-type` o `:last-child`

**Ejemplos de selectores válidos:**
```javascript
'.markdown:last-of-type'                    // Último elemento con esa clase
'[data-message-author-role="assistant"]:last-of-type .markdown'
'.model-response:last-of-type'
'message-content:last-of-type'
```

### Paso 3: Probar el Selector

En la consola de DevTools, prueba tu selector:
```javascript
document.querySelector('tu-selector-aqui')
```

Si devuelve el elemento correcto, ¡el selector funciona! ✅

### Paso 4: Actualizar content_script.js

Abre `content_script.js` y busca el objeto `SELECTORS`. Actualiza los selectores de la IA correspondiente:

```javascript
const SELECTORS = {
    chatgpt: {
        inputField: 'TU_NUEVO_SELECTOR',
        sendButton: 'TU_NUEVO_SELECTOR',
        responseContainer: 'TU_NUEVO_SELECTOR',
        lastResponse: 'TU_NUEVO_SELECTOR'
    },
    // ... otros
};
```

### Paso 5: Recargar la Extensión

1. Ve a `chrome://extensions/`
2. Encuentra "Multi-Chat AI"
3. Haz clic en el botón de recarga (ícono circular)
4. Prueba la extensión nuevamente

## 📚 Ejemplos Completos por IA

### ChatGPT (Actualizado Enero 2025)

```javascript
chatgpt: {
    inputField: '#prompt-textarea, textarea[placeholder*="Message"]',
    sendButton: 'button[data-testid="send-button"]',
    responseContainer: '[data-message-author-role="assistant"]',
    lastResponse: '[data-message-author-role="assistant"]:last-of-type .markdown'
}
```

### Google Gemini

```javascript
gemini: {
    inputField: '.ql-editor, div[contenteditable="true"][role="textbox"]',
    sendButton: 'button[aria-label*="Send"]',
    responseContainer: '.model-response',
    lastResponse: '.model-response:last-of-type'
}
```

### Claude

```javascript
claude: {
    inputField: 'div[contenteditable="true"][role="textbox"]',
    sendButton: 'button[aria-label*="Send"]',
    responseContainer: '.font-claude-message',
    lastResponse: '.font-claude-message:last-of-type'
}
```

## 💡 Tips y Mejores Prácticas

### 1. Usa Selectores Múltiples
Usa comas para proporcionar alternativas:
```javascript
inputField: '#prompt-textarea, textarea[placeholder*="Message"], textarea'
```

### 2. Evita Selectores Frágiles
❌ **EVITA:**
- Clases generadas automáticamente: `.css-1234abc`
- IDs temporales: `#temp-123`
- Posiciones numéricas específicas: `div:nth-child(5)`

✅ **PREFIERE:**
- Atributos semánticos: `[aria-label="..."]`, `[role="..."]`
- Data attributes: `[data-testid="..."]`
- Clases semánticas: `.message-input`, `.send-button`

### 3. Sé Específico Pero Flexible
Balance entre especificidad y robustez:
```javascript
// Demasiado específico (se rompe fácilmente)
'div.container > div.chat > div.input > textarea#prompt'

// Muy general (puede seleccionar elemento equivocado)
'textarea'

// IDEAL: Específico pero robusto
'textarea[placeholder*="Message"], #prompt-textarea'
```

### 4. Prueba Antes de Confirmar
Siempre prueba el selector en la consola antes de actualizar el código:
```javascript
// Debe devolver exactamente 1 elemento
console.log(document.querySelector('tu-selector'));

// Debe devolver el texto esperado
console.log(document.querySelector('tu-selector').innerText);
```

## 🐛 Depuración de Problemas Comunes

### Problema: "Timeout esperando el selector"
**Causa:** El selector no encuentra el elemento
**Solución:**
1. Verifica que el selector es correcto en la consola
2. Asegúrate de que el elemento existe en el DOM
3. Puede que necesites esperar a que la página cargue

### Problema: "No se puede insertar texto"
**Causa:** El selector del inputField no es correcto o el método de inserción no funciona
**Solución:**
1. Verifica que el elemento es un textarea o contenteditable
2. Prueba diferentes métodos de inserción
3. Comprueba que los eventos se disparan correctamente

### Problema: "No se extrae la respuesta"
**Causa:** El selector de respuesta es incorrecto o la respuesta aún no ha terminado
**Solución:**
1. Verifica el selector de `lastResponse`
2. Aumenta el tiempo de espera en `maxWaitTime`
3. Comprueba que el MutationObserver detecta cambios

## 🔄 Proceso de Actualización Rápida

Si una IA deja de funcionar:

1. **Identifica cuál falla** - Mira la consola del content script
2. **Inspecciona el elemento** - Usa DevTools
3. **Copia el selector** - Click derecho > Copy > Copy selector
4. **Simplifica el selector** - Quita partes innecesarias
5. **Prueba en consola** - `document.querySelector('...')`
6. **Actualiza el código** - Edita `SELECTORS` en `content_script.js`
7. **Recarga extensión** - En `chrome://extensions/`
8. **Prueba** - Envía un prompt de prueba

## 📞 Necesitas Ayuda?

Si tienes problemas:
1. Revisa la consola de errores (F12)
2. Comprueba que los selectores funcionan manualmente
3. Asegúrate de estar usando la versión más reciente de la página
4. Considera abrir un issue en el repositorio del proyecto

---

**Última actualización:** Enero 2025
**Nota:** Los selectores pueden necesitar actualizaciones frecuentes debido a cambios en las plataformas.
