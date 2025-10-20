/**
 * Content Script con Streaming en Tiempo Real
 * Usa MutationObserver para capturar respuestas mientras se escriben
 */

// Evitar múltiples inyecciones
if (!window.multiChatAIInjected) {
    window.multiChatAIInjected = true;

    console.log('[Multi-Chat AI] Content script con streaming cargado');

    /**
     * Configuración de selectores para cada IA
     */
    const SELECTORS = {
        chatgpt: {
            inputField: [
                '#prompt-textarea',
                'textarea[id="prompt-textarea"]',
                'textarea[placeholder*="Message"]',
                'div[contenteditable="true"]',
                'main textarea'
            ].join(', '),
            sendButton: [
                'button[data-testid="send-button"]',
                'button[data-testid="fruitjuice-send-button"]',
                'form button[type="button"]:not([disabled])',
                'button[aria-label*="Send"]'
            ].join(', '),
            // Selector para el contenedor que cambia mientras se escribe
            streamingContainer: [
                '[data-message-author-role="assistant"]:last-of-type',
                'article[data-testid*="conversation"]:last-of-type',
                '.agent-turn:last-of-type'
            ].join(', ')
        },
        gemini: {
            inputField: [
                'rich-textarea[aria-label*="Enter"]',
                '.ql-editor[contenteditable="true"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea'
            ].join(', '),
            sendButton: [
                'button[aria-label*="Send"]',
                'button[mattooltip*="Send"]',
                'button.send-button'
            ].join(', '),
            streamingContainer: [
                'model-response:last-of-type',
                '.model-response-text:last-of-type',
                'message-content:last-of-type'
            ].join(', ')
        },
        claude: {
            inputField: [
                'div.ProseMirror[contenteditable="true"]',
                'div[contenteditable="true"][enterkeyhint="enter"]',
                'fieldset div[contenteditable="true"]',
                'div[role="textbox"][contenteditable="true"]'
            ].join(', '),
            sendButton: [
                'button[aria-label="Send Message"]',
                'button[aria-label*="Send"]',
                'fieldset button:not([disabled])',
                'form button[type="button"]'
            ].join(', '),
            streamingContainer: [
                // Claude tiene un atributo específico para streaming
                'div[data-is-streaming="true"]',
                'div[data-is-streaming="false"]:last-of-type',
                'div[data-test-render-count]:last-of-type',
                'main > div > div:last-child div[class*="whitespace"]'
            ].join(', ')
        },
        meta: {
            inputField: 'textarea[placeholder*="Ask"], textarea',
            sendButton: 'button[aria-label*="Send"], button[type="submit"]',
            streamingContainer: '.message-content:last-of-type, [role="article"]:last-of-type'
        },
        grok: {
            inputField: 'div[contenteditable="true"][role="textbox"], textarea',
            sendButton: 'button[data-testid*="send"], button[aria-label*="Send"]',
            streamingContainer: '[data-testid="grokMessage"]:last-of-type, [role="article"]:last-of-type'
        },
        perplexity: {
            inputField: 'textarea[placeholder*="Ask"], div[contenteditable="true"]',
            sendButton: 'button[aria-label*="Submit"], button[type="submit"]',
            streamingContainer: '.prose:last-of-type, [class*="Answer"]:last-of-type'
        }
    };

    // Estado global para el observer
    let currentObserver = null;
    let currentAiType = null;
    let lastSentText = '';

    /**
     * Escuchar mensajes del background script
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Multi-Chat AI] Mensaje recibido:', message);

        if (message.type === 'INJECT_PROMPT') {
            handleInjectPrompt(message.prompt, message.aiType)
                .then(() => sendResponse({ success: true }))
                .catch((error) => {
                    console.error('[Multi-Chat AI] Error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        }

        if (message.type === 'STOP_STREAMING') {
            stopStreamingObserver();
            sendResponse({ success: true });
            return true;
        }
    });

    /**
     * Manejar la inyección del prompt con streaming
     */
    async function handleInjectPrompt(prompt, aiType) {
        console.log(`[Multi-Chat AI] Inyectando en ${aiType}:`, prompt.substring(0, 50) + '...');

        try {
            const selectors = SELECTORS[aiType];
            if (!selectors) {
                throw new Error(`Tipo de IA desconocido: ${aiType}`);
            }

            // Detener observer anterior si existe
            stopStreamingObserver();

            // 1. Encontrar el campo de entrada
            const inputField = await waitForElement(selectors.inputField, 5000);
            console.log('[Multi-Chat AI] Campo encontrado');

            // 2. Insertar el texto
            await insertText(inputField, prompt);
            console.log('[Multi-Chat AI] Texto insertado');

            await sleep(800);

            // 3. Encontrar y hacer clic en el botón
            const sendButton = await waitForElement(selectors.sendButton, 5000);

            // Esperar a que el botón esté habilitado
            let attempts = 0;
            while ((sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true') && attempts < 10) {
                await sleep(500);
                attempts++;
            }

            // 4. ANTES de hacer clic, configurar el streaming observer
            currentAiType = aiType;
            setupStreamingObserver(selectors, aiType);

            // 5. Hacer clic
            sendButton.click();
            await sleep(200);

            // Verificar si se envió
            if (!sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
                sendButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                await sleep(100);
                sendButton.click();
            }

            console.log('[Multi-Chat AI] ✓ Prompt enviado, streaming activo');

        } catch (error) {
            console.error(`[Multi-Chat AI] Error en ${aiType}:`, error);
            chrome.runtime.sendMessage({
                type: 'EXTRACTION_ERROR',
                aiType: aiType,
                error: error.message
            });
        }
    }

    /**
     * Configurar MutationObserver para streaming en tiempo real
     */
    function setupStreamingObserver(selectors, aiType) {
        console.log('[Multi-Chat AI] 🔴 Iniciando streaming observer para', aiType);

        // Esperar un poco antes de buscar el contenedor de respuesta
        setTimeout(() => {
            const responseContainer = document.querySelector(selectors.streamingContainer);

            if (!responseContainer) {
                console.warn('[Multi-Chat AI] No se encontró el contenedor de respuesta aún');
                // Intentar observar todo el documento por ahora
                observeDocument(selectors, aiType);
                return;
            }

            console.log('[Multi-Chat AI] Contenedor de respuesta encontrado, observando cambios...');

            // Configurar el observer
            currentObserver = new MutationObserver((mutations) => {
                handleStreamingUpdate(aiType, responseContainer);
            });

            // Observar cambios en el contenedor
            currentObserver.observe(responseContainer, {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: true
            });

            // También observar el documento completo por si el contenedor cambia
            observeDocument(selectors, aiType);

        }, 1000);
    }

    /**
     * Observar todo el documento (fallback)
     */
    function observeDocument(selectors, aiType) {
        const docObserver = new MutationObserver(() => {
            const container = document.querySelector(selectors.streamingContainer);
            if (container) {
                handleStreamingUpdate(aiType, container);
            }
        });

        docObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Guardar referencia para poder detenerlo después
        if (!currentObserver) {
            currentObserver = docObserver;
        }
    }

    /**
     * Manejar actualizaciones del streaming
     */
    let lastUpdateTime = 0;
    const THROTTLE_MS = 200; // Enviar actualizaciones cada 200ms máximo

    function handleStreamingUpdate(aiType, container) {
        const now = Date.now();

        // Throttling para no saturar
        if (now - lastUpdateTime < THROTTLE_MS) {
            return;
        }
        lastUpdateTime = now;

        try {
            const currentText = container.innerText || container.textContent || '';

            // Solo enviar si hay texto nuevo
            if (currentText && currentText !== lastSentText) {
                lastSentText = currentText;

                // Enviar la actualización al background
                chrome.runtime.sendMessage({
                    type: 'STREAMING_UPDATE',
                    aiType: aiType,
                    response: currentText,
                    isComplete: isResponseComplete(container, aiType)
                }).catch(err => {
                    // Ignorar errores de "no receiver"
                    if (!err.message.includes('Receiving end does not exist')) {
                        console.error('[Multi-Chat AI] Error enviando update:', err);
                    }
                });

                console.log(`[Multi-Chat AI] 📡 Streaming update (${currentText.length} chars)`);
            }
        } catch (error) {
            console.error('[Multi-Chat AI] Error en streaming update:', error);
        }
    }

    /**
     * Detectar si la respuesta está completa
     */
    function isResponseComplete(container, aiType) {
        // Para Claude, hay un atributo específico
        if (aiType === 'claude') {
            const streamingAttr = container.getAttribute('data-is-streaming');
            if (streamingAttr === 'false') {
                console.log('[Multi-Chat AI] ✅ Claude streaming completado');
                stopStreamingObserver();
                return true;
            }
        }

        // Para otras IAs, buscar indicadores de "generando"
        const loadingIndicators = container.querySelectorAll('.loading, .generating, [aria-live="polite"]');
        if (loadingIndicators.length === 0) {
            // No hay indicadores de carga, probablemente terminó
            // Esperar 2 segundos más para confirmar
            setTimeout(() => {
                const finalText = container.innerText || container.textContent || '';
                if (finalText === lastSentText) {
                    console.log('[Multi-Chat AI] ✅ Respuesta completada');

                    // Enviar mensaje final
                    chrome.runtime.sendMessage({
                        type: 'RESPONSE_EXTRACTED',
                        aiType: aiType,
                        response: finalText
                    });

                    stopStreamingObserver();
                }
            }, 2000);
        }

        return false;
    }

    /**
     * Detener el observer actual
     */
    function stopStreamingObserver() {
        if (currentObserver) {
            currentObserver.disconnect();
            currentObserver = null;
            console.log('[Multi-Chat AI] ⏹️ Streaming observer detenido');
        }
        lastSentText = '';
    }

    /**
     * Insertar texto en el campo de entrada
     */
    async function insertText(element, text) {
        console.log('[Multi-Chat AI] Insertando texto...');

        element.click();
        await sleep(100);
        element.focus();
        await sleep(100);

        // Para contenteditable
        if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
            element.innerHTML = '';
            element.textContent = '';
            await sleep(50);

            try {
                element.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                await sleep(50);

                const lines = text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    document.execCommand('insertText', false, lines[i]);
                    if (i < lines.length - 1) {
                        document.execCommand('insertLineBreak');
                    }
                }
            } catch (e) {
                console.warn('[Multi-Chat AI] execCommand falló:', e);
                element.innerHTML = text.replace(/\n/g, '<br>');
            }

            await sleep(100);
            const events = [
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true }),
                new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
                new KeyboardEvent('keyup', { key: ' ', bubbles: true })
            ];

            for (const event of events) {
                element.dispatchEvent(event);
                await sleep(50);
            }
        }
        // Para textarea/input
        else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            try {
                const prototype = element.tagName === 'TEXTAREA'
                    ? window.HTMLTextAreaElement.prototype
                    : window.HTMLInputElement.prototype;

                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
                nativeInputValueSetter.call(element, '');
                await sleep(50);
                nativeInputValueSetter.call(element, text);
                await sleep(100);
            } catch (e) {
                element.value = text;
            }

            const events = [
                new Event('focus', { bubbles: true }),
                new Event('click', { bubbles: true }),
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('input', { bubbles: true }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true }),
                new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
                new KeyboardEvent('keyup', { key: ' ', bubbles: true })
            ];

            for (const event of events) {
                element.dispatchEvent(event);
                await sleep(30);
            }
        }

        element.blur();
        await sleep(50);
        element.focus();
        await sleep(100);
    }

    /**
     * Esperar a que aparezca un elemento
     */
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout: ${selector}`));
            }, timeout);
        });
    }

    /**
     * Sleep helper
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('[Multi-Chat AI] ✓ Content script con streaming listo');
}
