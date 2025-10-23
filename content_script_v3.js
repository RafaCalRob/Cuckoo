/**
 * Content Script V3 - Método Robusto con Clipboard
 * Usa portapapeles y simulación directa de teclado
 * Más confiable que depender de selectores CSS específicos
 */

// Evitar múltiples inyecciones
if (!window.multiChatAIInjected) {
    window.multiChatAIInjected = true;

    console.log('[Multi-Chat AI v3] Content script cargado');

    /**
     * Configuración simplificada por IA
     */
    const AI_CONFIGS = {
        chatgpt: {
            name: 'ChatGPT',
            // Selectores múltiples como fallback
            inputSelectors: [
                '#prompt-textarea',
                'textarea[placeholder*="Message"]',
                'textarea[placeholder*="message"]',
                'div[contenteditable="true"]',
                'textarea',
                'main textarea',
                '[data-id*="root"] textarea'
            ],
            submitSelectors: [
                'button[data-testid="send-button"]',
                'button[data-testid="fruitjuice-send-button"]',
                'button[aria-label*="Send"]',
                'form button:not([disabled])',
                'button[type="button"]'
            ],
            // Selectores para capturar respuestas
            responseSelectors: [
                '[data-message-author-role="assistant"]:last-of-type',
                'article[data-testid*="conversation"]:last-of-type',
                '.agent-turn:last-of-type',
                '[data-testid*="conversation-turn"]:last-of-type',
                'main [class*="markdown"]:last-of-type'
            ]
        },
        gemini: {
            name: 'Gemini',
            inputSelectors: [
                'rich-textarea',
                '.ql-editor[contenteditable="true"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea',
                '[jsname] div[contenteditable="true"]'
            ],
            submitSelectors: [
                'button[aria-label*="Send"]',
                'button[mattooltip*="Send"]',
                'button.send-button',
                'button[jsname*="send"]'
            ],
            responseSelectors: [
                'model-response:last-of-type',
                '.model-response-text:last-of-type',
                'message-content:last-of-type',
                '[jsname] [class*="response"]:last-of-type',
                '.response-container-content:last-of-type'
            ]
        },
        claude: {
            name: 'Claude',
            inputSelectors: [
                'div.ProseMirror[contenteditable="true"]',
                'div[contenteditable="true"][enterkeyhint="enter"]',
                'fieldset div[contenteditable="true"]',
                'div[role="textbox"][contenteditable="true"]',
                '[data-value] div[contenteditable="true"]'
            ],
            submitSelectors: [
                'button[aria-label="Send Message"]',
                'button[aria-label*="Send"]',
                'fieldset button:not([disabled])',
                'form button[type="button"]',
                'button[type="button"]'
            ],
            responseSelectors: [
                'div[data-is-streaming="false"]:last-of-type',
                'div[data-is-streaming="true"]:last-of-type',
                'div[data-test-render-count]:last-of-type',
                'main > div > div:last-child div[class*="whitespace"]',
                '[class*="claude"] [class*="message"]:last-of-type'
            ]
        },
        meta: {
            name: 'Meta AI',
            inputSelectors: [
                'textarea[placeholder*="Ask"]',
                'textarea',
                'div[contenteditable="true"]'
            ],
            submitSelectors: [
                'button[aria-label*="Send"]',
                'button[type="submit"]'
            ],
            responseSelectors: [
                '.message-content:last-of-type',
                '[role="article"]:last-of-type',
                '[class*="response"]:last-of-type'
            ]
        },
        grok: {
            name: 'Grok',
            inputSelectors: [
                'div[contenteditable="true"][role="textbox"]',
                'textarea'
            ],
            submitSelectors: [
                'button[data-testid*="send"]',
                'button[aria-label*="Send"]'
            ],
            responseSelectors: [
                '[data-testid="grokMessage"]:last-of-type',
                '[role="article"]:last-of-type',
                '[data-testid*="message"]:last-of-type'
            ]
        },
        perplexity: {
            name: 'Perplexity',
            inputSelectors: [
                'textarea[placeholder*="Ask"]',
                'div[contenteditable="true"]',
                'textarea'
            ],
            submitSelectors: [
                'button[aria-label*="Submit"]',
                'button[type="submit"]'
            ],
            responseSelectors: [
                '.prose:last-of-type',
                '[class*="Answer"]:last-of-type',
                '[class*="response"]:last-of-type'
            ]
        }
    };

    /**
     * Escuchar mensajes del background
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Multi-Chat AI v3] Mensaje recibido:', message);

        if (message.type === 'INJECT_PROMPT') {
            console.log('[Multi-Chat AI v3] Tipo correcto, procesando...');
            console.log('[Multi-Chat AI v3] Prompt:', message.prompt.substring(0, 50) + '...');
            console.log('[Multi-Chat AI v3] AI Type:', message.aiType);

            handleInjectPromptV3(message.prompt, message.aiType)
                .then(() => {
                    console.log('[Multi-Chat AI v3] ✓ Procesado exitosamente');
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('[Multi-Chat AI v3] ❌ Error:', error);
                    console.error('[Multi-Chat AI v3] Error stack:', error.stack);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        } else {
            console.log('[Multi-Chat AI v3] Tipo de mensaje desconocido:', message.type);
        }
    });

    /**
     * Método principal V3: Robusto con múltiples estrategias
     */
    async function handleInjectPromptV3(prompt, aiType) {
        console.log(`[Multi-Chat AI v3] Inyectando en ${aiType}`);

        const config = AI_CONFIGS[aiType];
        if (!config) {
            throw new Error(`Tipo de IA desconocido: ${aiType}`);
        }

        // Estrategia 1: Encontrar campo de entrada
        const inputField = await findElementWithMultipleSelectors(config.inputSelectors, 8000);

        if (!inputField) {
            throw new Error(`No se encontró el campo de entrada para ${aiType}`);
        }

        console.log('[Multi-Chat AI v3] Campo de entrada encontrado:', inputField);

        // Estrategia 2: Insertar texto usando múltiples métodos
        await insertTextRobust(inputField, prompt);

        await sleep(800);

        // Estrategia 3: Encontrar y hacer click en el botón de envío
        const submitButton = await findElementWithMultipleSelectors(config.submitSelectors, 5000);

        if (!submitButton) {
            // Fallback: Intentar enviar con Enter
            console.log('[Multi-Chat AI v3] No se encontró botón, intentando Enter');
            inputField.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            }));
            await sleep(500);
            return;
        }

        // Esperar a que el botón esté habilitado
        let attempts = 0;
        while ((submitButton.disabled || submitButton.getAttribute('aria-disabled') === 'true') && attempts < 15) {
            await sleep(300);
            attempts++;
        }

        // Hacer click múltiples veces si es necesario
        console.log('[Multi-Chat AI v3] Haciendo click en botón de envío');
        submitButton.click();
        await sleep(200);

        // Verificar si se envió, sino intentar de nuevo
        if (!submitButton.disabled && submitButton.getAttribute('aria-disabled') !== 'true') {
            submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await sleep(100);
            submitButton.click();
        }

        console.log('[Multi-Chat AI v3] ✓ Prompt enviado exitosamente');

        // Notificar al background que se envió
        chrome.runtime.sendMessage({
            type: 'PROMPT_SENT',
            aiType: aiType
        });

        // Iniciar captura de respuesta
        await sleep(1500);
        startResponseCapture(config, aiType);
    }

    /**
     * Capturar la respuesta en tiempo real
     */
    let currentObserver = null;
    let lastResponseText = '';

    function startResponseCapture(config, aiType) {
        console.log(`[Multi-Chat AI v3] Iniciando captura de respuesta para ${aiType}`);

        // Detener observer anterior si existe
        if (currentObserver) {
            currentObserver.disconnect();
            currentObserver = null;
        }

        lastResponseText = '';

        // Intentar encontrar el contenedor de respuestas
        let checkAttempts = 0;
        const maxAttempts = 20; // 20 segundos máximo

        const checkInterval = setInterval(() => {
            checkAttempts++;

            const responseContainer = findElementWithMultipleSelectorsSync(config.responseSelectors);

            if (responseContainer) {
                console.log('[Multi-Chat AI v3] Contenedor de respuesta encontrado, observando...');
                clearInterval(checkInterval);
                observeResponseContainer(responseContainer, aiType);
            } else if (checkAttempts >= maxAttempts) {
                console.warn('[Multi-Chat AI v3] No se encontró el contenedor de respuesta después de', maxAttempts, 'intentos');
                clearInterval(checkInterval);

                // Enviar error
                chrome.runtime.sendMessage({
                    type: 'EXTRACTION_ERROR',
                    aiType: aiType,
                    error: 'No se pudo capturar la respuesta. La IA puede no haber respondido aún.'
                });
            }
        }, 1000);
    }

    /**
     * Observar cambios en el contenedor de respuesta
     */
    function observeResponseContainer(container, aiType) {
        currentObserver = new MutationObserver((mutations) => {
            const currentText = container.innerText || container.textContent || '';

            // Solo enviar si hay cambios
            if (currentText && currentText !== lastResponseText) {
                lastResponseText = currentText;

                // Enviar actualización en streaming
                chrome.runtime.sendMessage({
                    type: 'STREAMING_UPDATE',
                    aiType: aiType,
                    response: currentText,
                    isComplete: false
                }).catch(err => {
                    console.log('[Multi-Chat AI v3] Error enviando update:', err.message);
                });

                console.log(`[Multi-Chat AI v3] Streaming update: ${currentText.length} chars`);
            }
        });

        // Configurar el observer
        currentObserver.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // También observar todo el documento por si el contenedor cambia
        const documentObserver = new MutationObserver(() => {
            const newContainer = findElementWithMultipleSelectorsSync(getConfigForAI(aiType).responseSelectors);
            if (newContainer && newContainer !== container) {
                console.log('[Multi-Chat AI v3] Contenedor de respuesta cambió, actualizando observer');
                if (currentObserver) {
                    currentObserver.disconnect();
                }
                observeResponseContainer(newContainer, aiType);
            }
        });

        documentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Detectar cuando la respuesta está completa
        setTimeout(() => {
            detectResponseCompletion(container, aiType);
        }, 3000);
    }

    /**
     * Detectar cuando la respuesta está completa
     */
    function detectResponseCompletion(container, aiType) {
        let lastLength = 0;
        let stableCount = 0;

        const completionInterval = setInterval(() => {
            const currentText = container.innerText || container.textContent || '';
            const currentLength = currentText.length;

            if (currentLength === lastLength) {
                stableCount++;
            } else {
                stableCount = 0;
                lastLength = currentLength;
            }

            // Si el texto no ha cambiado en 3 segundos, considerarlo completo
            if (stableCount >= 3) {
                console.log('[Multi-Chat AI v3] ✓ Respuesta completada');
                clearInterval(completionInterval);

                if (currentObserver) {
                    currentObserver.disconnect();
                    currentObserver = null;
                }

                // Enviar mensaje final
                chrome.runtime.sendMessage({
                    type: 'STREAMING_UPDATE',
                    aiType: aiType,
                    response: currentText,
                    isComplete: true
                });

                chrome.runtime.sendMessage({
                    type: 'RESPONSE_EXTRACTED',
                    aiType: aiType,
                    response: currentText
                });
            }
        }, 1000);

        // Timeout máximo de 2 minutos
        setTimeout(() => {
            clearInterval(completionInterval);
            if (currentObserver) {
                currentObserver.disconnect();
                currentObserver = null;
            }
        }, 120000);
    }

    /**
     * Buscar elemento con múltiples selectores (sincrónico)
     */
    function findElementWithMultipleSelectorsSync(selectors) {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element && isElementVisible(element)) {
                    return element;
                }
            } catch (e) {
                // Selector inválido, continuar
            }
        }
        return null;
    }

    /**
     * Obtener config para una IA específica
     */
    function getConfigForAI(aiType) {
        return AI_CONFIGS[aiType] || {};
    }

    /**
     * Buscar elemento usando múltiples selectores
     */
    async function findElementWithMultipleSelectors(selectors, timeout = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            for (const selector of selectors) {
                try {
                    const element = document.querySelector(selector);
                    if (element && isElementVisible(element)) {
                        return element;
                    }
                } catch (e) {
                    // Selector inválido, continuar
                }
            }
            await sleep(500);
        }

        return null;
    }

    /**
     * Verificar si un elemento es visible
     */
    function isElementVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               element.offsetWidth > 0 &&
               element.offsetHeight > 0;
    }

    /**
     * Insertar texto de forma robusta usando múltiples métodos
     */
    async function insertTextRobust(element, text) {
        console.log('[Multi-Chat AI v3] Insertando texto...');

        // Hacer focus
        element.click();
        await sleep(100);
        element.focus();
        await sleep(100);

        // Método 1: Para contenteditable
        if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
            return await insertIntoContentEditable(element, text);
        }

        // Método 2: Para textarea/input
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            return await insertIntoTextarea(element, text);
        }

        // Método 3: Fallback - intentar ambos
        try {
            await insertIntoContentEditable(element, text);
        } catch (e) {
            await insertIntoTextarea(element, text);
        }
    }

    /**
     * Insertar en elementos contenteditable
     */
    async function insertIntoContentEditable(element, text) {
        // Limpiar contenido previo
        element.innerHTML = '';
        element.textContent = '';
        await sleep(50);

        element.focus();

        // Método 1: execCommand (deprecated pero funciona)
        try {
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
            await sleep(50);

            // Insertar línea por línea
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                document.execCommand('insertText', false, lines[i]);
                if (i < lines.length - 1) {
                    document.execCommand('insertLineBreak');
                }
            }
        } catch (e) {
            // Fallback: innerHTML
            element.innerHTML = text.replace(/\n/g, '<br>');
        }

        // Disparar eventos
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
            await sleep(30);
        }
    }

    /**
     * Insertar en textarea/input
     */
    async function insertIntoTextarea(element, text) {
        try {
            // Método nativo para evitar que React/Vue lo detecte
            const prototype = element.tagName === 'TEXTAREA'
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;

            const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

            nativeSetter.call(element, '');
            await sleep(50);
            nativeSetter.call(element, text);
            await sleep(100);
        } catch (e) {
            // Fallback
            element.value = text;
        }

        // Disparar eventos
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

    /**
     * Sleep helper
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('[Multi-Chat AI v3] ✓ Content script listo');
}
