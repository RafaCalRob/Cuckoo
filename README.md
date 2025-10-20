# Multi-Chat AI 🚀

Una extensión de navegador de **pantalla completa** que te permite enviar prompts a múltiples servicios de IA (ChatGPT, Google Gemini y Claude) simultáneamente y comparar sus respuestas lado a lado con una interfaz profesional y moderna.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Características Principales

### 🎯 Core Features
- ✅ **Pantalla completa** - Interfaz amplia y profesional (no es un popup pequeño)
- ✅ **Envío simultáneo** a ChatGPT, Google Gemini y Claude
- ✅ **Comparación lado a lado** con diseño de 3 columnas
- ✅ **Apertura automática de pestañas** - Abre las IAs con un solo click
- ✅ **Detección inteligente** de respuestas completas
- ✅ **Compatible con Manifest V3**

### 🎨 Personalización
- 🌓 **Tema claro/oscuro** - Cambia entre temas con persistencia
- 🌍 **Multiidioma** - Soporte completo para Español e Inglés
- 📊 **Métricas en tiempo real** - Palabras y tiempo de respuesta
- 📋 **Copiar/Limpiar** respuestas individuales
- 🎨 **Diseño moderno** con gradientes y animaciones suaves

### 🔥 Funciones Avanzadas
- 📝 **Modo Resumen** - Condensa automáticamente respuestas largas
- ⚡ **Prompts personalizados** - Envía diferentes prompts a cada IA
- 🎓 **Tutorial integrado** - Guía interactiva para nuevos usuarios
- 🔄 **Auto-scroll** opcional en las respuestas
- ⌨️ **Atajos de teclado** - `Ctrl/Cmd + Enter` para enviar
- 💾 **Persistencia** - Guarda preferencias automáticamente

### 📊 Monitoreo y Control
- 🟢 **Indicadores de estado** en tiempo real para cada IA
- ⏱️ **Temporizador** de respuesta para cada servicio
- 📈 **Contador** de respuestas activas
- 🔍 **Contador de caracteres** en tiempo real

---

## 🚀 Instalación

### Requisitos Previos
- **Navegador**: Chrome, Edge, Brave, o cualquier navegador basado en Chromium
- **Cuentas**: Acceso a ChatGPT, Gemini y/o Claude (al menos una)

### Pasos de Instalación

1. **Descargar el proyecto**
   ```bash
   git clone https://github.com/tu-usuario/multi-chat-ai.git
   cd multi-chat-ai
   ```
   O descarga como ZIP y descomprime.

2. **Verificar iconos** ✅
   - Los iconos ya están incluidos en la carpeta `icons/`
   - Si quieres personalizarlos, reemplaza: `icon16.png`, `icon48.png`, `icon128.png`

3. **Cargar la extensión**
   - Abre Chrome/Edge
   - Navega a `chrome://extensions/`
   - Activa el **"Modo de desarrollador"** (esquina superior derecha)
   - Click en **"Cargar extensión sin empaquetar"**
   - Selecciona la carpeta `Cuckoo`
   - ✅ La extensión aparecerá en la lista

4. **Primer uso**
   - Click en el icono de la extensión en la barra de herramientas
   - Se abrirá una nueva pestaña con la interfaz completa
   - El tutorial se mostrará automáticamente la primera vez

---

## 📖 Guía de Uso

### 🎯 Inicio Rápido

1. **Abrir las IAs**
   - Click en el botón **"Abrir IAs"**
   - Se abrirán automáticamente ChatGPT, Gemini y Claude en pestañas nuevas
   - Inicia sesión en cada una si es necesario

2. **Enviar un Prompt**
   - Escribe tu pregunta en el área de texto
   - Click **"Enviar a Todas las IAs"** o `Ctrl/Cmd + Enter`
   - Observa las respuestas aparecer en las 3 columnas

3. **Comparar Respuestas**
   - Lee las respuestas lado a lado
   - Usa el botón de copiar para guardar una respuesta específica
   - Limpia columnas individuales si lo deseas

### 🎨 Personalización

#### Cambiar Tema
- Click en el icono de sol/luna en la esquina superior derecha
- Cambia entre modo oscuro y claro
- El tema se guarda automáticamente

#### Cambiar Idioma
- Desplegable en la esquina superior derecha
- Opciones: 🇪🇸 Español | 🇬🇧 English
- La interfaz se actualiza instantáneamente

#### Modo Resumen
- Activa el toggle **"Modo Resumen"** en el panel de control
- Las respuestas se condensan a las primeras 3 frases
- Ideal para comparaciones rápidas

### ⚡ Funciones Avanzadas

#### Prompts Personalizados
1. Click en la pestaña **"Prompts Personalizados"**
2. Escribe un prompt diferente para cada IA
3. Click **"Enviar Prompts Personalizados"**
4. Útil cuando quieres aprovechar las fortalezas de cada IA

#### Atajos de Teclado
- `Ctrl/Cmd + Enter` - Enviar prompt
- `Esc` - Cerrar tutorial (si está abierto)

---

## 🔧 Estructura del Proyecto

```
Cuckoo/
├── manifest.json              # Configuración Manifest V3
├── index.html                 # Interfaz de pantalla completa
├── background.js              # Service Worker principal
├── content_script.js          # Interacción con páginas de IA
│
├── styles/
│   └── main.css              # Estilos completos (dark/light theme)
│
├── js/
│   ├── app.js                # Lógica principal de la app
│   └── background-handler.js # Manejador de comunicación
│
├── icons/                     # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── popup.html                 # Popup antiguo (legacy)
├── popup.js                   # Lógica popup antiguo
├── style.css                  # Estilos popup antiguo
│
├── README.md                  # Este archivo
└── SELECTOR_GUIDE.md         # Guía para actualizar selectores
```

---

## ⚙️ Configuración

### Preferencias Guardadas
La extensión guarda automáticamente:
- ✅ Tema seleccionado (claro/oscuro)
- ✅ Idioma preferido
- ✅ Estado del modo resumen
- ✅ Estado del auto-scroll
- ✅ Si ya has visto el tutorial

### Restablecer Configuración
Abre la consola del navegador en la página de la extensión y ejecuta:
```javascript
chrome.storage.sync.clear();
location.reload();
```

---

## ⚠️ Solución de Problemas

### La extensión no carga
**Problema**: Error al cargar la extensión en `chrome://extensions/`

**Solución**:
1. Verifica que todos los archivos estén presentes
2. Confirma que la carpeta `icons/` tiene los 3 archivos PNG
3. Recarga la extensión con el botón circular
4. Revisa errores en la consola de la extensión

### No se detectan las pestañas
**Problema**: Mensaje "No se encontraron pestañas abiertas"

**Solución**:
1. Click en **"Abrir IAs"** para abrir las pestañas automáticamente
2. Asegúrate de estar autenticado en cada IA
3. Verifica que las URLs coincidan:
   - ChatGPT: `https://chat.openai.com`
   - Gemini: `https://gemini.google.com`
   - Claude: `https://claude.ai`

### Los prompts no se insertan
**Problema**: Los prompts no aparecen en las páginas de las IAs

**Solución**:
1. Los **selectores CSS pueden haber cambiado** (esto es común)
2. Consulta `SELECTOR_GUIDE.md` para actualizarlos
3. Abre las herramientas de desarrollador (F12) en cada página de IA
4. Busca errores en la consola
5. Actualiza los selectores en `content_script.js`

### Las respuestas no se extraen
**Problema**: Las respuestas no aparecen en las columnas

**Solución**:
1. Espera más tiempo (algunas IAs son lentas)
2. Verifica los selectores de `lastResponse` en `content_script.js`
3. Comprueba la consola para errores de timeout
4. Asegúrate de que las IAs hayan generado respuestas

---

## 🐛 Depuración Avanzada

### Ver Logs del Background Script
1. Ve a `chrome://extensions/`
2. Busca "Multi-Chat AI"
3. Click en **"Service Worker"** o **"Inspeccionar vistas"**
4. Abre la consola para ver logs

### Ver Logs del Content Script
1. Abre las herramientas de desarrollador (F12) en la página de una IA
2. Ve a la pestaña **Console**
3. Busca mensajes con "Content script" o "Multi-Chat AI"

### Ver Logs de la Interfaz
1. Con la página de la extensión abierta, presiona F12
2. Ve a Console
3. Verás logs de app.js

---

## 🔒 Privacidad y Seguridad

- ✅ **No recopilamos datos**: La extensión no envía información a servidores externos
- ✅ **Código abierto**: Todo el código es visible y auditable
- ✅ **Permisos mínimos**: Solo solicita permisos necesarios
- ✅ **Local first**: Las preferencias se guardan solo en tu navegador
- ✅ **Sin APIs externas**: No usamos servicios de terceros

### Permisos Utilizados
- `tabs` - Para detectar y abrir pestañas de las IAs
- `scripting` - Para inyectar el content script
- `storage` - Para guardar preferencias
- `activeTab` - Para interactuar con la pestaña activa

---

## 📝 Notas Técnicas

### Manifest V3
Esta extensión usa el estándar más reciente de Chrome (Manifest V3), que incluye:
- Service Workers en lugar de background pages
- Mayor seguridad y rendimiento
- APIs modernas

### Selectores CSS
⚠️ **Importante**: Los selectores en `content_script.js` pueden romperse cuando:
- ChatGPT, Gemini o Claude actualizan su interfaz
- Cambian la estructura HTML
- Introducen nuevas funcionalidades

📖 Consulta `SELECTOR_GUIDE.md` para instrucciones detalladas de actualización.

### Limitaciones Conocidas
- ❌ No funciona sin pestañas abiertas (no usa APIs oficiales)
- ❌ Requiere autenticación manual en cada IA
- ❌ Los selectores CSS pueden romperse con actualizaciones
- ❌ No guarda historial de conversaciones
- ❌ Limitado por rate limits de cada IA

---

## 🚧 Roadmap - Próximas Mejoras

### v2.1 (Próximamente)
- [ ] Historial de prompts y respuestas
- [ ] Exportar conversaciones a PDF/Markdown
- [ ] Temas personalizables adicionales
- [ ] Soporte para más IAs (Perplexity, etc.)

### v2.2 (Futuro)
- [ ] Detección automática de cambios en selectores
- [ ] Modo comparación visual mejorado
- [ ] Plantillas de prompts guardadas
- [ ] Estadísticas de uso

### v3.0 (Largo plazo)
- [ ] Integración con APIs oficiales (opcional)
- [ ] Modo colaborativo
- [ ] Plugin system para extensiones

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Puedes ayudar:

1. **Reportando bugs** - Abre un issue con detalles
2. **Actualizando selectores** - Cuando las IAs cambien
3. **Traduciendo** - Añade nuevos idiomas
4. **Mejorando el código** - Pull requests son bienvenidos
5. **Documentación** - Mejora este README o las guías

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

```
MIT License - Eres libre de:
✅ Usar comercialmente
✅ Modificar
✅ Distribuir
✅ Uso privado
```

---

## 🙏 Agradecimientos

- **OpenAI** por ChatGPT
- **Google** por Gemini
- **Anthropic** por Claude
- **Comunidad de Chrome Extensions** por documentación y ejemplos

---

## 📞 Soporte

¿Necesitas ayuda?

1. 📖 Lee `SELECTOR_GUIDE.md` si los selectores no funcionan
2. 🐛 Revisa la sección de Solución de Problemas arriba
3. 💬 Abre un issue en GitHub
4. 📧 Contacta al desarrollador

---

## ⚡ Quick Links

- [📖 Guía de Selectores](SELECTOR_GUIDE.md)
- [🔧 Reportar Bug](https://github.com/tu-usuario/multi-chat-ai/issues)
- [💡 Solicitar Funcionalidad](https://github.com/tu-usuario/multi-chat-ai/issues/new)
- [📚 Documentación de Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/)

---

<div align="center">

**Hecho con ❤️ para la comunidad de IA**

⭐ Si te gusta el proyecto, dale una estrella en GitHub

[⬆️ Volver arriba](#multi-chat-ai-)

</div>

---

**Nota**: Esta extensión no está afiliada con OpenAI, Google, Anthropic ni ninguna de las IAs mencionadas. Es un proyecto independiente de código abierto.

**Última actualización**: Enero 2025 - Versión 2.0
