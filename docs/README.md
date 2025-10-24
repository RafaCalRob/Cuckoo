# 📚 Documentación Técnica - Milana Extension

## 🎯 Objetivo

Esta documentación explica **técnicamente** cómo funciona la comunicación con backends de diferentes IAs (ChatGPT, Gemini, Perplexity, Mistral, DeepSeek) desde una Chrome Extension.

**Lo que aprenderás:**
- ✅ Cómo los navegadores se comunican con servidores
- ✅ Técnicas de "spoofing" para parecer una petición legítima
- ✅ Chrome Extension Manifest V3 arquitectura
- ✅ Server-Sent Events (SSE) streaming
- ✅ Diferencias entre Webapp Mode y API Direct Mode
- ✅ Cómo analizar y replicar APIs no documentadas

---

## 📖 Guía de Lectura

### 1️⃣ **ARQUITECTURA_TECNICA.md** (Empieza aquí)
**Tiempo estimado: 30-45 minutos**

Conceptos fundamentales:
- ¿Qué es un backend API?
- Componentes de peticiones HTTP
- Chrome Extension Manifest V3
- Técnicas de Origin Spoofing
- Server-Sent Events (SSE)
- Content Security Policy

**👉 Lee esto primero si:**
- Es tu primera vez con extensiones de Chrome
- Quieres entender la teoría antes del código
- Necesitas referencias conceptuales

**Contenido:**
```
1. Conceptos Fundamentales
   - Backend APIs
   - Componentes HTTP
   - Headers, Cookies, Origin

2. Tipos de Comunicación
   - Webapp Mode
   - API Direct Mode
   - Ventajas y limitaciones

3. Chrome Extension Manifest V3
   - Service Workers
   - Content Scripts
   - Permisos críticos

4. Técnicas de Spoofing
   - Origin modification
   - Cookie injection
   - User-Agent spoofing

5. Server-Sent Events
   - Formato SSE
   - Implementación streaming
   - OpenAI-compatible APIs

6. Casos Prácticos
   - ChatGPT webapp
   - Gemini webapp
   - Perplexity + Origin spoofing
   - Mistral API directa
   - DeepSeek API directa

7. Herramientas de Análisis
   - Chrome DevTools
   - Copy as cURL
   - Extensiones útiles
```

---

### 2️⃣ **EJEMPLOS_PRACTICOS.md** (Código real)
**Tiempo estimado: 45-60 minutos**

Código comentado línea por línea:
- Implementación completa de ChatGPT
- Implementación completa de Mistral
- Debugging en tiempo real
- Ejercicios prácticos

**👉 Lee esto si:**
- Ya entendiste los conceptos
- Quieres ver código real
- Necesitas implementar una nueva IA

**Contenido:**
```
1. Ejemplo ChatGPT Webapp
   - 7 pasos comentados
   - Código real con explicaciones
   - Por qué funciona

2. Ejemplo Mistral API
   - Implementación directa
   - Sin spoofing necesario
   - Formato OpenAI-compatible

3. Debugging
   - Chrome DevTools paso a paso
   - Extension Console
   - Network Monitor custom

4. Ejercicios
   - Analizar Claude.ai
   - Implementar Rate Limiter
   - Cache de respuestas
```

---

### 3️⃣ **DIAGRAMAS_VISUALES.md** (Diagramas ASCII)
**Tiempo estimado: 20-30 minutos**

Diagramas visuales de todos los flujos:
- Arquitectura general
- Flujo ChatGPT paso a paso
- Flujo Mistral comparado
- CORS explicado visualmente
- Timeline de streaming

**👉 Lee esto si:**
- Eres visual learner
- Te confunden los textos largos
- Quieres referencias rápidas

**Contenido:**
```
1. Arquitectura General
   - Componentes de la extensión
   - Popup → Background → Content

2. Flujo ChatGPT
   - 12 pasos visualizados
   - Desde UI hasta servidor

3. Flujo Mistral
   - Solo 7 pasos
   - Mucho más simple

4. Comparación CORS
   - Lo que NO funciona
   - Lo que SÍ funciona

5. Streaming SSE
   - Timeline de chunks
   - Streaming vs No-Streaming

6. Conceptos Clave
   - Same-Origin Policy
   - Cookie Flow
   - Manifest V3 Permissions
```

---

## 🚀 Rutas de Aprendizaje

### Ruta Rápida (1 hora)
```
1. Lee "Conceptos Fundamentales" en ARQUITECTURA_TECNICA.md (15 min)
2. Lee "Ejemplo ChatGPT" en EJEMPLOS_PRACTICOS.md (20 min)
3. Revisa DIAGRAMAS_VISUALES.md completo (15 min)
4. Práctica: Analiza una IA en DevTools (10 min)
```

### Ruta Completa (3 horas)
```
1. ARQUITECTURA_TECNICA.md completo (45 min)
2. EJEMPLOS_PRACTICOS.md completo (60 min)
3. DIAGRAMAS_VISUALES.md completo (30 min)
4. Ejercicios prácticos (45 min):
   - Analizar Claude
   - Implementar Rate Limiter
   - Crear cache
```

### Ruta Práctica (solo código)
```
1. EJEMPLOS_PRACTICOS.md → Ejemplo ChatGPT (20 min)
2. EJEMPLOS_PRACTICOS.md → Ejemplo Mistral (15 min)
3. Copia el código a tu proyecto (30 min)
4. Debugging con DevTools (30 min)
```

---

## 📁 Estructura de Archivos

```
docs/
├── README.md                      ← Estás aquí
├── ARQUITECTURA_TECNICA.md        ← Teoría y conceptos
├── EJEMPLOS_PRACTICOS.md          ← Código comentado
└── DIAGRAMAS_VISUALES.md          ← Diagramas ASCII

Archivos complementarios:
├── RESUMEN_PROYECTO.md            ← Overview del proyecto
├── FIXES_APPLIED.md               ← Historial de fixes
├── APIS_REACTIVADAS.md            ← APIs que funcionan
├── INSTRUCCIONES_PRUEBA.md        ← Cómo probar
└── FIX_MAIN_WORLD.md              ← Fix técnico DOM
```

---

## 🎓 Conceptos Clave por Nivel

### Nivel 1: Principiante
**Debes entender:**
- [ ] Qué es una petición HTTP
- [ ] Qué son headers y cookies
- [ ] Qué es CORS
- [ ] Diferencia entre GET y POST
- [ ] Qué es JSON

**Lee:**
- ARQUITECTURA_TECNICA.md: Sección 1
- DIAGRAMAS_VISUALES.md: Sección 4

### Nivel 2: Intermedio
**Debes entender:**
- [ ] Chrome Extension Manifest V3
- [ ] Service Workers vs Content Scripts
- [ ] Same-Origin Policy
- [ ] Fetch API
- [ ] Async/Await

**Lee:**
- ARQUITECTURA_TECNICA.md: Secciones 2-3
- EJEMPLOS_PRACTICOS.md: Sección 1
- DIAGRAMAS_VISUALES.md: Secciones 1-2

### Nivel 3: Avanzado
**Debes entender:**
- [ ] Server-Sent Events (SSE)
- [ ] ReadableStream API
- [ ] Origin Spoofing con declarativeNetRequest
- [ ] Cookie injection
- [ ] Rate limiting y caching

**Lee:**
- ARQUITECTURA_TECNICA.md: Secciones 4-5
- EJEMPLOS_PRACTICOS.md: Secciones 2-4
- DIAGRAMAS_VISUALES.md: Sección 5

---

## 🛠️ Herramientas Necesarias

### Para Desarrollo
```bash
# Editor de código
- VS Code (recomendado)
- Extensión: Chrome Extension Developer

# Navegador
- Google Chrome o Chromium
- Modo desarrollador activado en chrome://extensions/

# Testing
- Postman o Thunder Client (opcional)
- cURL para línea de comandos (opcional)
```

### Para Debugging
```
Chrome DevTools:
  - Network tab (ver peticiones)
  - Console tab (logs)
  - Application tab (cookies, storage)
  - Sources tab (breakpoints en código)

Extension Console:
  chrome://extensions/
  → Modo desarrollador
  → "Inspect service worker"
```

---

## 📝 Glosario Técnico

| Término | Significado |
|---------|-------------|
| **API** | Application Programming Interface - forma de comunicar dos programas |
| **Backend** | Servidor que procesa peticiones y devuelve datos |
| **Content Script** | Código inyectado en páginas web desde una extensión |
| **CORS** | Cross-Origin Resource Sharing - política de seguridad de navegadores |
| **Cookie** | Pequeño archivo que guarda sesión del usuario |
| **Header** | Metadatos de una petición HTTP |
| **Origin** | Protocolo + dominio + puerto (ej: https://chatgpt.com:443) |
| **Service Worker** | Script que corre en background en una extensión |
| **SSE** | Server-Sent Events - streaming de servidor a cliente |
| **Streaming** | Envío de datos en chunks en lugar de todo junto |
| **Tab** | Pestaña del navegador |
| **Token** | Cadena que identifica a un usuario autenticado |
| **Webapp Mode** | Inyectar código en la página web real |
| **API Mode** | Petición directa a API pública con key |

---

## 🔍 Cómo Usar Esta Documentación

### Caso 1: "Quiero agregar otra IA"

1. **Analiza la IA:**
   ```
   1. Abre la web (ej: claude.ai)
   2. F12 → Network → Fetch/XHR
   3. Envía un mensaje
   4. Encuentra el endpoint
   ```

2. **Lee:**
   - ARQUITECTURA_TECNICA.md → Sección 6 (Casos Prácticos)
   - EJEMPLOS_PRACTICOS.md → Ejercicio 1

3. **Implementa:**
   - Copia template de ChatGPT o Mistral
   - Adapta endpoint y formato
   - Prueba con DevTools

### Caso 2: "No entiendo por qué funciona"

1. **Lee en orden:**
   - ARQUITECTURA_TECNICA.md → Sección 1 (Fundamentos)
   - DIAGRAMAS_VISUALES.md → Sección 4 (CORS)
   - EJEMPLOS_PRACTICOS.md → Sección 1 (ChatGPT)

2. **Practica:**
   - Abre DevTools en chatgpt.com
   - Sigue el flujo paso a paso
   - Compara con los diagramas

### Caso 3: "Tengo un error de CORS"

1. **Identifica el problema:**
   ```
   Error: "Access-Control-Allow-Origin"
   → Estás haciendo fetch desde origen incorrecto
   ```

2. **Lee:**
   - DIAGRAMAS_VISUALES.md → Sección 4 (Comparación CORS)
   - ARQUITECTURA_TECNICA.md → Sección 4.2 (Cookie Injection)

3. **Solución:**
   - Usa content script en lugar de background
   - O usa declarativeNetRequest para modificar Origin

### Caso 4: "El streaming no funciona"

1. **Debug:**
   ```javascript
   const reader = response.body.getReader()

   while (true) {
     const { value } = await reader.read()
     console.log('Chunk:', new TextDecoder().decode(value))
   }
   ```

2. **Lee:**
   - ARQUITECTURA_TECNICA.md → Sección 5 (SSE)
   - DIAGRAMAS_VISUALES.md → Sección 5 (Timeline)

3. **Verifica:**
   - Content-Type: text/event-stream
   - Formato: `data: {...}\n\n`
   - Parseo correcto del JSON

---

## 💡 Tips y Mejores Prácticas

### 1. Siempre loggea todo
```javascript
console.log('[AI Name] Step:', description)
console.log('[AI Name] Data:', JSON.stringify(data))
console.error('[AI Name] Error:', error)
```

### 2. Maneja errores específicamente
```javascript
try {
  await sendToAI(prompt)
} catch (error) {
  if (error.message.includes('403')) {
    console.error('No autorizado - verifica sesión')
  } else if (error.message.includes('CORS')) {
    console.error('Error de origen - usa content script')
  } else {
    console.error('Error desconocido:', error)
  }
}
```

### 3. Usa timeouts
```javascript
const fetchWithTimeout = (url, options, timeout = 30000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ])
}
```

### 4. Implementa retry logic
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * (i + 1))  // Exponential backoff
    }
  }
}
```

---

## 🐛 Debugging Checklist

Cuando algo no funciona:

- [ ] ¿Está el usuario logueado en la web?
- [ ] ¿Tienes permisos en manifest.json?
- [ ] ¿El endpoint es correcto?
- [ ] ¿Los headers son correctos?
- [ ] ¿El formato del body es correcto?
- [ ] ¿Estás usando content script si necesitas cookies?
- [ ] ¿El streaming está configurado correctamente?
- [ ] ¿Hay logs en la consola?
- [ ] ¿La API key es válida? (para APIs directas)
- [ ] ¿Hay rate limiting?

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### APIs Documentadas
- [Mistral AI](https://docs.mistral.ai/)
- [DeepSeek](https://platform.deepseek.com/docs)
- [OpenAI Format](https://platform.openai.com/docs/api-reference)

### Herramientas
- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/)
- [cURL Tutorial](https://curl.se/docs/manual.html)

---

## 🤝 Contribuir

Si encuentras errores o quieres mejorar la documentación:

1. Lee los 3 documentos principales
2. Identifica qué falta o está mal
3. Propón cambios específicos
4. Incluye ejemplos si es posible

---

## ⚖️ Consideraciones Legales

**Esta documentación es con fines educativos.**

✅ **Uso legítimo:**
- Usar tus propias cuentas
- Uso personal normal
- Aprender cómo funcionan las APIs
- Desarrollo de herramientas personales

❌ **NO permitido:**
- Scraping masivo de datos
- Evadir rate limits con múltiples cuentas
- Revender acceso a APIs
- Uso comercial sin autorización
- Violar términos de servicio

**Siempre:**
- Lee los términos de servicio de cada plataforma
- Respeta los rate limits
- No abuses de las APIs gratuitas
- Usa API keys oficiales cuando estén disponibles

---

## 📧 Contacto

Para preguntas técnicas sobre esta documentación:
- Revisa primero los 3 documentos principales
- Busca en el glosario
- Verifica el debugging checklist

---

**Última actualización:** 2025-01-23
**Versión:** 1.0
**Autor:** Documentación técnica de Milana Extension

---

## 🎯 Próximos Pasos

Después de leer la documentación:

1. ✅ Carga la extensión en Chrome
2. ✅ Prueba ChatGPT, Gemini, Perplexity
3. ✅ Configura API keys de Mistral y DeepSeek
4. ✅ Abre DevTools y observa el Network tab
5. ✅ Intenta agregar otra IA siguiendo los ejemplos

**¡Buena suerte! 🚀**
