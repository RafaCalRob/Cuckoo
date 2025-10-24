# IMPLEMENTACIÓN DE GROQ - AGREGADOR MULTI-MODELO

## 📋 Resumen

En lugar de implementar Mistral, Gemma, Llama 3 y DeepSeek de forma individual (lo cual requeriría 4-6 APIs separadas), hemos implementado **Groq API** como agregador único que proporciona acceso a TODOS estos modelos con una sola API Key gratuita.

## ✅ ¿Qué es Groq?

Groq es una plataforma de inferencia ultra-rápida que ofrece acceso a múltiples modelos open-source a través de una API compatible con OpenAI. Con UNA sola API key gratis obtienes:

### Modelos Disponibles:

1. **Llama 3.1** (Meta)
   - `llama-3.1-70b-versatile` - 70B parámetros (recomendado)
   - `llama-3.1-8b-instant` - 8B parámetros (más rápido)

2. **Llama 3** (Meta)
   - `llama3-70b-8192` - 70B parámetros
   - `llama3-8b-8192` - 8B parámetros

3. **Gemma 2** (Google)
   - `gemma2-9b-it` - 9B parámetros
   - `gemma-7b-it` - 7B parámetros

4. **Mixtral** (Mistral AI)
   - `mixtral-8x7b-32768` - Modelo MoE 8x7B

5. **DeepSeek**
   - `deepseek-r1-distill-llama-70b` - DeepSeek R1 70B

## 🔧 Implementación Técnica

### 1. Backend (background_streaming.js)

```javascript
async function sendToGroqDirect(prompt) {
    // Obtener API key y modelo desde storage
    const apiKey = await getGroqApiKey();
    const model = await getGroqModel();

    // Mantener contexto de conversación
    groqConversationContext.messages.push({
        role: 'user',
        content: prompt
    });

    // Petición con streaming
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: groqConversationContext.messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096
        })
    });

    // Procesar streaming SSE (formato OpenAI)
    // ...
}
```

**Características:**
- ✅ Streaming en tiempo real (SSE)
- ✅ Mantenimiento de contexto conversacional
- ✅ Manejo de errores (401, 429, etc.)
- ✅ Compatible con formato OpenAI
- ✅ Almacenamiento persistente con chrome.storage.local

### 2. Frontend (index.html)

**Columna de Groq con Selector de Modelo:**
```html
<div class="chat-column" data-ai="groq">
    <div class="column-header">
        <select id="groq-model-select" class="model-selector">
            <option value="llama-3.1-70b-versatile" selected>Llama 3.1 70B</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
            <option value="gemma2-9b-it">Gemma 2 9B</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
            <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 70B</option>
        </select>
    </div>
    <div id="groq-response" class="response-content markdown-body"></div>
</div>
```

**Panel de Configuración de API Key:**
```html
<div class="api-key-section">
    <label for="groq-api-key">
        <strong>Groq API Key</strong>
        <a href="https://console.groq.com/keys" target="_blank">
            Obtener gratis →
        </a>
    </label>
    <div class="api-key-input-group">
        <input type="password" id="groq-api-key" placeholder="gsk_...">
        <button id="toggle-groq-key">👁️</button>
        <button id="save-groq-key">💾 Guardar</button>
        <button id="test-groq-key">🧪 Probar</button>
    </div>
    <p id="groq-key-status"></p>
</div>
```

### 3. UI Logic (app.js)

**Funcionalidades implementadas:**

1. **Cambio de modelo en tiempo real:**
```javascript
groqModelSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ groqModel: e.target.value });
});
```

2. **Guardar API Key:**
```javascript
saveGroqKey.addEventListener('click', () => {
    const apiKey = groqApiKey.value.trim();
    chrome.storage.local.set({ groqApiKey: apiKey });
});
```

3. **Probar conexión:**
```javascript
testGroqKey.addEventListener('click', async () => {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    // Validar respuesta
});
```

4. **Toggle visibilidad de API Key:**
```javascript
toggleGroqKey.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
});
```

### 4. Estilos (main.css)

**Grid actualizado a 5 columnas:**
```css
.responses-grid {
    grid-template-columns: repeat(5, 1fr);
}

/* Responsive */
@media (max-width: 1600px) {
    .responses-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

**Selector de modelo:**
```css
.model-selector {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 0.375rem 0.5rem;
    max-width: 150px;
}
```

**Sección de API Key:**
```css
.api-key-input {
    flex: 1;
    font-family: 'Courier New', monospace;
}

.api-key-status.success {
    color: var(--success);
    background: rgba(76, 175, 80, 0.1);
}

.api-key-status.error {
    color: var(--error);
    background: rgba(244, 67, 54, 0.1);
}
```

## 🚀 Cómo Usar

### Paso 1: Obtener API Key de Groq

1. Visitar: https://console.groq.com/keys
2. Crear cuenta gratuita
3. Generar nueva API key
4. Copiar la key (comienza con `gsk_...`)

### Paso 2: Configurar en la Extensión

1. Abrir Milana
2. Click en ⚙️ Configuración
3. Ir a sección "🔑 API Keys"
4. Pegar la API key en el campo "Groq API Key"
5. Click en "💾 Guardar"
6. (Opcional) Click en "🧪 Probar" para validar

### Paso 3: Seleccionar IA

1. En la sección "🤖 Seleccionar IAs Activas"
2. Marcar checkbox "Groq"
3. Guardar configuración

### Paso 4: Seleccionar Modelo

1. En la columna de Groq
2. Usar el selector desplegable en el header
3. Elegir modelo deseado:
   - **Llama 3.1 70B** - Mejor calidad general
   - **Llama 3.1 8B** - Más rápido
   - **Gemma 2 9B** - Balanced
   - **Mixtral 8x7B** - Excelente para tareas complejas
   - **DeepSeek R1** - Razonamiento avanzado

### Paso 5: Usar

1. Escribir prompt
2. Click en "Enviar a Todas las IAs"
3. Ver respuesta en tiempo real en la columna Groq

## 📊 Ventajas vs Implementación Individual

### ❌ Implementación Individual (lo que NO hicimos):

- Mistral API → Requiere API key de Mistral
- Groq API → Requiere API key de Groq
- DeepSeek API → Requiere API key de DeepSeek
- Perplexity API → Requiere API key de Perplexity
- **Total: 4 APIs separadas, 4 configuraciones**

### ✅ Implementación con Groq (lo que SÍ hicimos):

- Groq API → UNA sola API key
- **Acceso a: Llama 3.1, Llama 3, Gemma 2, Mixtral, DeepSeek**
- **Total: 1 API, 1 configuración, 8+ modelos**

## 🎯 Estado Final de IAs

| IA | Método | Requiere | Modelos |
|----|--------|----------|---------|
| ChatGPT | Webapp | Sesión chatgpt.com | GPT-4o |
| Gemini | Webapp | Sesión gemini.google.com | Gemini Pro |
| Claude | Webapp | Sesión claude.ai | Claude 3.5 |
| Perplexity | Webapp | Sesión perplexity.ai | Perplexity Pro |
| **Groq** | **API** | **API Key gratis** | **8+ modelos** |

**Total: 5 columnas, acceso a 12+ modelos de IA**

## 🔒 Seguridad

- API Key almacenada en `chrome.storage.local` (encriptado por Chrome)
- No se envía a servidores externos
- Input type `password` por defecto
- Toggle para mostrar/ocultar key
- Validación antes de guardar

## 🐛 Troubleshooting

### Error: "Groq API key not configured"
**Solución:** Configurar API key en Configuración → API Keys

### Error: "Groq API key is invalid"
**Solución:**
1. Verificar que la key comience con `gsk_`
2. Regenerar key en console.groq.com
3. Usar botón "🧪 Probar" para validar

### Error: "Groq rate limit exceeded"
**Solución:** Esperar 1 minuto. Groq tiene límites generosos pero existen.

### No aparece respuesta
**Solución:**
1. Verificar que checkbox "Groq" esté marcado en Configuración
2. Verificar API key guardada correctamente
3. Revisar Console del navegador (F12)

## 📝 Archivos Modificados

1. **background_streaming.js** (líneas 1340-1516)
   - Función `sendToGroqDirect()`
   - Función `getGroqApiKey()`
   - Función `getGroqModel()`
   - Función `setGroqModel()`
   - Agregado al handler `handleSendPrompt()`

2. **index.html** (líneas 500-556 y 188-222)
   - Columna de Groq con selector de modelo
   - Sección de configuración de API Key
   - Checkbox en selector de IAs

3. **styles/main.css** (líneas 512, 571-593, 945-1015, 1182-1198)
   - Grid de 5 columnas
   - Estilos para model-selector
   - Estilos para api-key-section
   - Responsive breakpoints actualizados

4. **js/app.js** (líneas 90-100, 141, 263-325, 337-355, 187-195)
   - DOM references para Groq
   - Event listeners para modelo y API key
   - Función `showGroqKeyStatus()`
   - Carga de settings de Groq

## 🎉 Resultado

Ahora tienes acceso a:
- **4 IAs via webapp** (gratis, sin configurar): ChatGPT, Gemini, Claude, Perplexity
- **8+ modelos via Groq API** (gratis con API key): Llama 3.1, Gemma 2, Mixtral, DeepSeek, etc.

**Total: 12+ modelos de IA en una sola interfaz**
