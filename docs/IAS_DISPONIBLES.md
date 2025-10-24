# IAs DISPONIBLES EN CHATHUB - RESUMEN

## ✅ YA IMPLEMENTADAS (Webapp - Sesión del navegador)

### 1. ChatGPT (OpenAI)
- **Endpoint**: `https://chatgpt.com/backend-api/conversation`
- **Auth**: Access token + Proof-of-work
- **Estado**: ✅ Funcionando

### 2. Gemini (Google)
- **Endpoint**: `https://gemini.google.com/_/BardChatUi/data/...`
- **Auth**: Tokens AT/BL del HTML
- **Estado**: ✅ Funcionando

### 3. Claude (Anthropic)
- **Endpoint**: `https://claude.ai/api/organizations/{org}/chat_conversations/{conv}/completion`
- **Auth**: Cookies de sesión
- **Estado**: ✅ Implementado

### 4. Perplexity
- **Endpoint**: `https://www.perplexity.ai/rest/sse/perplexity_ask`
- **Auth**: Cookies de sesión
- **Estado**: ⚠️ Implementado pero sin probar

---

## 📋 OTRAS IAS EN CHATHUB (Requieren API Keys)

### APIs de Pago

ChatHub usa estas APIs, pero **REQUIEREN API KEYS** que el usuario debe configurar:

1. **Perplexity API**
   - Endpoint: Docs en https://docs.perplexity.ai/
   - Requiere: API Key

2. **Mistral API**
   - Endpoint: https://api.mistral.ai/v1/chat/completions
   - Requiere: API Key de https://console.mistral.ai/

3. **Groq API** ⭐ **MÁS IMPORTANTE**
   - Endpoint: https://api.groq.com/openai/v1/chat/completions
   - Requiere: API Key de https://console.groq.com/
   - **MODELOS DISPONIBLES EN GROQ**:
     - **Llama 3** (llama-3.1-70b-versatile, llama-3.1-8b-instant)
     - **Gemma** (gemma-7b-it, gemma2-9b-it)
     - **Mixtral** (mixtral-8x7b-32768)
     - Y más...

4. **DeepSeek API**
   - Endpoint: https://api.deepseek.com/v1/chat/completions
   - Requiere: API Key de https://platform.deepseek.com/

5. **Moonshot API** (China)
   - Endpoint: https://api.moonshot.cn/v1/chat/completions
   - Requiere: API Key

---

## 🎯 ESTRATEGIA RECOMENDADA

### Opción 1: Solo Webapp (Sin API Keys)
**PROS**:
- Gratis para el usuario
- No hay que configurar nada
- Usa las sesiones que ya tienen

**CONTRAS**:
- Solo tenemos 4 IAs (ChatGPT, Gemini, Claude, Perplexity)

### Opción 2: Agregar Groq (1 API Key → Muchos modelos)
**PROS**:
- Con UNA sola API key de Groq se accede a:
  - Llama 3.1 (70B y 8B)
  - Gemma 2 (9B)
  - Mixtral 8x7B
  - Muchos más modelos open-source
- Groq es GRATIS (tier gratuito generoso)
- API compatible OpenAI (fácil implementación)

**CONTRAS**:
- Usuario debe crear cuenta en Groq y obtener API key

---

## 💡 RECOMENDACIÓN FINAL

**IMPLEMENTAR GROQ COMO AGREGADOR**

En vez de agregar 5-6 IAs individuales, agregamos **GROQ** que da acceso a:
- Llama 3.1 (Meta)
- Gemma 2 (Google)
- Mixtral (Mistral)
- DeepSeek
- Y más

**Plan de Implementación:**

1. **Panel de Configuración** con campo para API Key de Groq
2. **Selector de Modelo** dentro de Groq (Llama, Gemma, Mixtral...)
3. **Una sola columna** que muestra el modelo seleccionado

Esto es MUCHO más simple que implementar 6 IAs separadas y le da al usuario:
- ChatGPT (webapp)
- Gemini (webapp)
- Claude (webapp)
- Perplexity (webapp)
- **Groq con múltiples modelos** (API key gratuita)

---

## 📝 IMPLEMENTACIÓN DE GROQ

```javascript
async function sendToGroq(prompt, model = 'llama-3.1-70b-versatile') {
    const apiKey = await getGroqApiKey(); // Desde chrome.storage

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{
                role: 'user',
                content: prompt
            }],
            stream: true // Soporta streaming!
        })
    });

    // Procesar streaming SSE igual que ChatGPT
}
```

**Modelos disponibles:**
- `llama-3.1-70b-versatile`
- `llama-3.1-8b-instant`
- `gemma-7b-it`
- `gemma2-9b-it`
- `mixtral-8x7b-32768`

---

## 🚫 POR QUÉ NO WEBAPP DE OTRAS IAS

Mistral, Groq, DeepSeek NO tienen interfaces webapp públicas que podamos clonar como ChatGPT/Gemini/Claude.

Solo tienen:
- APIs de pago (requieren key)
- O plataformas web que usan las mismas APIs

Por eso ChatHub los implementa via API, no via webapp.

---

## ✅ ESTADO FINAL PROPUESTO

| IA | Método | Estado | Requiere |
|----|--------|--------|----------|
| ChatGPT | Webapp | ✅ Funciona | Sesión chatgpt.com |
| Gemini | Webapp | ✅ Funciona | Sesión gemini.google.com |
| Claude | Webapp | ✅ Implementado | Sesión claude.ai |
| Perplexity | Webapp | ⚠️ Por probar | Sesión perplexity.ai |
| **Groq (Multi-modelo)** | **API** | **🔜 Por implementar** | **API Key gratuita** |

Con esta configuración tenemos:
- **4 IAs webapp** (gratis, sin configurar)
- **1 agregador (Groq)** con 10+ modelos (gratis con API key)

**Total: Acceso a 14+ modelos de IA**
