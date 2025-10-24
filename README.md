# Multi-Chat AI Extension

Extensión de Chrome que permite enviar prompts a múltiples IAs simultáneamente y comparar sus respuestas en tiempo real.

## 🚀 Características

- ✅ **Gemini** - Integración completa con Google Gemini
- ✅ **ChatGPT** - Integración completa con OpenAI ChatGPT (incluyendo Plus)
- ⏳ **Claude** - Próximamente
- 🔄 **Streaming en tiempo real** - Ver respuestas mientras se generan
- 🎯 **Comparación lado a lado** - Compara respuestas de diferentes IAs
- 💾 **Historial de conversaciones** - Mantiene el contexto entre mensajes

## 📦 Instalación

### Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd Cuckoo
   ```

2. **Cargar en Chrome**
   - Abrir Chrome y navegar a `chrome://extensions/`
   - Activar "Modo de desarrollador" (esquina superior derecha)
   - Click en "Cargar extensión sin empaquetar"
   - Seleccionar la carpeta del proyecto

3. **Iniciar sesión en las IAs**
   - **Gemini**: Ir a https://gemini.google.com e iniciar sesión
   - **ChatGPT**: Ir a https://chatgpt.com e iniciar sesión

## 🎯 Uso

### Método 1: Interfaz Principal

1. Click en el icono de la extensión
2. Escribe tu prompt
3. Selecciona las IAs que quieres usar
4. Click en "Enviar"
5. Observa las respuestas en tiempo real

### Método 2: Context Menu (Click Derecho)

1. Selecciona texto en cualquier página
2. Click derecho → "Multi-Chat AI"
3. Elige la acción:
   - **Enviar a todas las IAs** - Envía el texto seleccionado
   - **Explicar esto** - Pide explicación del texto
   - **Traducir al español** - Traduce el texto

### Método 3: Sidebar

1. Click derecho en cualquier página
2. Multi-Chat AI → "Abrir Chat Sidebar"
3. Usa el sidebar sin salir de la página

## 🏗️ Estructura del Proyecto

```
Cuckoo/
├── manifest.json              # Configuración de la extensión
├── background_streaming.js    # Lógica principal (Gemini + ChatGPT)
├── sha3.js                    # Librería SHA3 para proof-of-work
├── index.html                 # Interfaz principal
├── content_script_direct_api.js  # Content script para inyección
├── sidebar.js / sidebar.css   # Sidebar flotante
├── icons/                     # Iconos de la extensión
├── js/                        # Scripts de la UI
│   ├── app.js                 # Lógica principal de la UI
│   ├── settings-manager.js    # Gestor de configuración
│   ├── winner-system.js       # Sistema de ganadores
│   ├── sequential-mode.js     # Modo secuencial
│   └── background-handler.js  # Comunicación con background
├── styles/                    # Estilos CSS
│   ├── main.css               # Estilos principales
│   └── modern.css             # Tema moderno
├── docs/                      # Documentación técnica
└── 3.99.4_0/                  # Código de referencia (ChatHub)
```

## 🔧 Tecnologías

- **Manifest V3** - Última versión de extensiones de Chrome
- **Service Workers** - Background script sin bloqueo
- **Streaming API** - Respuestas en tiempo real
- **Chrome Storage API** - Almacenamiento persistente
- **SHA3 (js-sha3)** - Proof-of-work para ChatGPT

## 📚 Documentación Técnica

La documentación detallada está en la carpeta `docs/`:

- **[EXTENSION_CLONADA_COMPLETA.md](docs/EXTENSION_CLONADA_COMPLETA.md)** - Guía completa de implementación
- **[METODO_GEMINI_CHATHUB_REAL.md](docs/METODO_GEMINI_CHATHUB_REAL.md)** - Método de integración con Gemini
- **[METODO_CHATGPT_CHATHUB_REAL.md](docs/METODO_CHATGPT_CHATHUB_REAL.md)** - Método de integración con ChatGPT
- **[SOLUCION_MANIFEST_V3.md](docs/SOLUCION_MANIFEST_V3.md)** - Soluciones para Manifest V3

## ⚙️ Configuración

### Gemini

**No requiere configuración adicional.** Solo necesitas estar logueado en https://gemini.google.com

**Cómo funciona:**
1. Obtiene tokens AT y BL del HTML de Gemini
2. Envía peticiones directas a la API interna
3. Usa `credentials: 'include'` para mantener la sesión

### ChatGPT

**No requiere configuración adicional.** Solo necesitas estar logueado en https://chatgpt.com

**Cómo funciona:**
1. Obtiene el `accessToken` de `/api/auth/session`
2. Calcula proof-of-work con SHA3-512
3. Envía peticiones a `/backend-api/conversation`
4. Mantiene Device ID persistente en `chrome.storage`

**⏱️ Nota:** El proof-of-work puede tardar 5-15 segundos la primera vez (es normal en Manifest V3).

## 🐛 Troubleshooting

### Gemini no responde

**Problema:** "No se pudieron extraer los tokens"

**Solución:**
1. Asegúrate de estar logueado en https://gemini.google.com
2. Recarga la extensión en `chrome://extensions`
3. Intenta de nuevo

### ChatGPT no responde

**Problema:** "There is no logged-in ChatGPT account"

**Solución:**
1. Asegúrate de estar logueado en https://chatgpt.com
2. Verifica que tu sesión no haya expirado
3. Si tienes Cloudflare, resuélvelo manualmente

**Problema:** "Proof-of-work tarda mucho"

**Solución:**
- Es normal (5-15 segundos)
- Manifest V3 no soporta Web Workers
- El cálculo se hace inline en el Service Worker

### Error: "screen is not defined" o "localStorage is not defined"

**Solución:**
- Ya está solucionado en la última versión
- Usa `chrome.storage` y valores por defecto
- Recarga la extensión

## 🔒 Privacidad

- ✅ **No almacena tus prompts** - Todo se procesa localmente
- ✅ **No envía datos a terceros** - Solo a las APIs oficiales de las IAs
- ✅ **Usa tu sesión** - Reutiliza tus sesiones activas de Gemini/ChatGPT
- ✅ **Device ID local** - Solo se guarda en `chrome.storage.local`
- ✅ **Open Source** - Código 100% auditable

## 📝 Changelog

### v1.0 (2025-01-21)

- ✅ Implementación completa de Gemini
- ✅ Implementación completa de ChatGPT (con proof-of-work)
- ✅ Streaming en tiempo real
- ✅ Interfaz moderna con modo oscuro
- ✅ Context menu y sidebar
- ✅ Compatible con Manifest V3
- ✅ Historial de conversaciones

## 🙏 Créditos

- Basado en la arquitectura de [ChatHub](https://github.com/chathub-dev/chathub)
- Usa [js-sha3](https://github.com/emn178/js-sha3) para proof-of-work

---

**⭐ Si te gusta este proyecto, dale una estrella!**
