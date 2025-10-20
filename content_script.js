/**
 * Content Script - Interactúa directamente con las páginas de las IAs
 * Este script se inyecta en las páginas de ChatGPT, Gemini y Claude
 */

// Evitar múltiples inyecciones del script
if (!window.multiChatAIInjected) {
    window.multiChatAIInjected = true;

    console.log('Content script de Multi-Chat AI inyectado');

    /**
     * Configuración de selectores para cada IA
     * NOTA: Estos selectores pueden cambiar cuando las páginas se actualicen
     */
    const SELECTORS = {
        chatgpt: {
            // Selectores para ChatGPT (actualizados 2025 - chatgpt.com)
            inputField: [
                '#prompt-textarea',
                'textarea[id="prompt-textarea"]',
                'textarea[placeholder*="Message"]',
                'textarea[placeholder*="ChatGPT"]',
                'textarea[data-id="root"]',
                'div[contenteditable="true"]',
                'main textarea',
                'form textarea'
            ].join(', '),
            sendButton: [
                'button[data-testid="send-button"]',
                'button[data-testid="fruitjuice-send-button"]',
                'form button[type="button"]:not([disabled])',
                'button[aria-label*="Send"]',
                'button:has(svg)',
                'button[data-testid*="send"]'
            ].join(', '),
            responseContainer: [
                '[data-message-author-role="assistant"]',
                '[data-testid="conversation-turn-3"]',
                'article[data-testid*="conversation"]',
                '.agent-turn',
                'div[class*="agent"]'
            ].join(', '),
            lastResponse: [
                '[data-message-author-role="assistant"]:last-of-type',
                '[data-testid*="conversation-turn"]:last-of-type',
                '.agent-turn:last-of-type'
            ].join(', ')
        },
        gemini: {
            // Selectores para Google Gemini
            inputField: [
                'rich-textarea[aria-label*="Enter"]',
                '.ql-editor[contenteditable="true"]',
                'div[contenteditable="true"][role="textbox"]',
                '[aria-label*="Enter a prompt"]',
                'textarea'
            ].join(', '),
            sendButton: [
                'button[aria-label*="Send"]',
                'button[mattooltip*="Send"]',
                'button.send-button',
                '[aria-label*="Submit"]'
            ].join(', '),
            responseContainer: [
                '.model-response-text',
                'model-response',
                'message-content',
                '.response-container'
            ].join(', '),
            lastResponse: [
                'model-response:last-of-type',
                '.model-response-text:last-of-type',
                'message-content:last-of-type'
            ].join(', ')
        },
        claude: {
            // Selectores para Claude (actualizados 2025)
            inputField: [
                'div.ProseMirror[contenteditable="true"]',
                'div[contenteditable="true"][enterkeyhint="enter"]',
                'div[contenteditable="true"].ProseMirror',
                'fieldset div[contenteditable="true"]',
                'div[data-placeholder*="Reply"]',
                'div[role="textbox"][contenteditable="true"]'
            ].join(', '),
            sendButton: [
                'button[aria-label="Send Message"]',
                'button[aria-label*="Send"]',
                'fieldset button:not([disabled])',
                'button:has(svg[viewBox="0 0 28 28"])',
                'button:has(path[d*="M11"])',
                'form button[type="button"]'
            ].join(', '),
            responseContainer: [
                'div[data-is-streaming="false"]',
                'div[data-is-streaming="true"]',
                'div[data-test-render-count]',
                'div[class*="font-claude"]',
                'main div[class*="whitespace"]'
            ].join(', '),
            lastResponse: [
                'div[data-is-streaming="false"]:last-of-type',
                'div[data-test-render-count]:last-of-type',
                'main > div > div:last-child div[class*="whitespace"]'
            ].join(', ')
        },
        meta: {
            // Selectores para Meta AI
            inputField: [
                'textarea[placeholder*="Ask"]',
                'textarea[aria-label*="Message"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea'
            ].join(', '),
            sendButton: [
                'button[aria-label*="Send"]',
                'button[type="submit"]',
                'button.send-button'
            ].join(', '),
            responseContainer: [
                '.message-content',
                '[role="article"]',
                '.response-text'
            ].join(', '),
            lastResponse: [
                '.message-content:last-of-type',
                '[role="article"]:last-of-type'
            ].join(', ')
        },
        grok: {
            // Selectores para Grok (X/Twitter)
            inputField: [
                'div[contenteditable="true"][data-testid*="messageBox"]',
                'div[contenteditable="true"][role="textbox"]',
                'textarea'
            ].join(', '),
            sendButton: [
                'button[data-testid*="send"]',
                'button[aria-label*="Send"]',
                'button[type="submit"]'
            ].join(', '),
            responseContainer: [
                '[data-testid="grokMessage"]',
                '.grok-response',
                '[role="article"]'
            ].join(', '),
            lastResponse: [
                '[data-testid="grokMessage"]:last-of-type',
                '[role="article"]:last-of-type'
            ].join(', ')
        },
        perplexity: {
            // Selectores para Perplexity
            inputField: [
                'textarea[placeholder*="Ask"]',
                'textarea[placeholder*="Follow"]',
                'div[contenteditable="true"]',
                'textarea'
            ].join(', '),
            sendButton: [
                'button[aria-label*="Submit"]',
                'button[type="submit"]',
                'button.submit-button'
            ].join(', '),
            responseContainer: [
                '.prose',
                '.answer-content',
                '[class*="Answer"]'
            ].join(', '),
            lastResponse: [
                '.prose:last-of-type',
                '[class*="Answer"]:last-of-type'
            ].join(', ')
        }
    };

    /**
     * Escuchar mensajes del background script
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Content script recibió mensaje:', message);

        if (message.type === 'INJECT_PROMPT') {
            handleInjectPrompt(message.prompt, message.aiType)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('Error al inyectar prompt:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Mantener el canal abierto para respuesta asíncrona
        }
    });

    /**
     * Manejar la inyección del prompt
     */
    async function handleInjectPrompt(prompt, aiType) {
        console.log(`Inyectando prompt en ${aiType}:`, prompt);

        try {
            const selectors = SELECTORS[aiType];
            if (!selectors) {
                throw new Error(`Tipo de IA desconocido: ${aiType}`);
            }

            // Paso 1: Encontrar el campo de entrada
            const inputField = await waitForElement(selectors.inputField, 5000);
            console.log('Campo de entrada encontrado:', inputField);

            // Paso 2: Insertar el texto
            await insertText(inputField, prompt);
            console.log('Texto insertado');

            // Paso 3: Esperar un momento antes de buscar el botón
            await sleep(800);

            // Paso 4: Encontrar y hacer clic en el botón de envío
            console.log('Buscando botón de envío con selector:', selectors.sendButton);
            let sendButton;

            try {
                sendButton = await waitForElement(selectors.sendButton, 5000);
                console.log('Botón de envío encontrado:', sendButton);
            } catch (error) {
                console.error('No se encontró el botón con los selectores principales. Intentando búsqueda alternativa...');

                // Búsqueda alternativa: buscar cualquier botón que parezca de envío
                const allButtons = document.querySelectorAll('button');
                for (const btn of allButtons) {
                    const ariaLabel = btn.getAttribute('aria-label') || '';
                    const innerHTML = btn.innerHTML.toLowerCase();
                    if (ariaLabel.includes('Send') || ariaLabel.includes('Enviar') ||
                        innerHTML.includes('send') || innerHTML.includes('arrow-up') ||
                        !btn.disabled) {
                        sendButton = btn;
                        console.log('Botón encontrado con búsqueda alternativa:', btn);
                        break;
                    }
                }

                if (!sendButton) {
                    throw new Error('No se pudo encontrar el botón de envío');
                }
            }

            // Asegurarse de que el botón esté habilitado
            let attempts = 0;
            while ((sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true') && attempts < 10) {
                console.log('Botón deshabilitado, esperando...', attempts);
                await sleep(500);
                attempts++;
            }

            // Hacer clic múltiples veces si es necesario
            console.log('Haciendo clic en el botón de envío...');
            sendButton.click();
            await sleep(200);

            // Verificar si se envió, si no, intentar de nuevo
            if (sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true') {
                console.log('Parece que el mensaje fue enviado (botón deshabilitado)');
            } else {
                console.log('Botón aún habilitado, intentando clic de nuevo...');
                sendButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                await sleep(100);
                sendButton.click();
            }

            console.log('Botón clickeado');

            // Paso 5: Esperar y extraer la respuesta
            await waitForResponse(selectors, aiType);

        } catch (error) {
            console.error(`Error en ${aiType}:`, error);
            // Notificar al background sobre el error
            chrome.runtime.sendMessage({
                type: 'EXTRACTION_ERROR',
                aiType: aiType,
                error: error.message
            });
        }
    }

    /**
     * Insertar texto en el campo de entrada - Versión ultra mejorada
     */
    async function insertText(element, text) {
        console.log('Insertando texto en elemento:', element.tagName, element.className);

        // Asegurar focus múltiple
        element.click();
        await sleep(100);
        element.focus();
        await sleep(100);

        // Para elementos contenteditable (Claude, a veces Gemini, algunos ChatGPT)
        if (element.contentEditable === 'true' || element.getAttribute('contenteditable') === 'true') {
            console.log('Insertando en contenteditable');

            // Limpiar completamente
            element.innerHTML = '';
            element.textContent = '';
            await sleep(50);

            // Método 1: Usar execCommand primero (más compatible)
            try {
                element.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                await sleep(50);

                // Insertar texto línea por línea si tiene saltos de línea
                const lines = text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    document.execCommand('insertText', false, lines[i]);
                    if (i < lines.length - 1) {
                        document.execCommand('insertLineBreak');
                    }
                }
                console.log('Texto insertado con execCommand');
            } catch (e) {
                console.warn('execCommand falló, usando método alternativo:', e);
                // Fallback: usar innerHTML
                element.innerHTML = text.replace(/\n/g, '<br>');
            }

            // Método 2: Disparar eventos para frameworks modernos
            await sleep(100);
            const events = [
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true, cancelable: true }),
                new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }),
                new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true })
            ];

            for (const event of events) {
                element.dispatchEvent(event);
                await sleep(50);
            }
        }
        // Para textarea e input (ChatGPT principalmente usa textarea)
        else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            console.log('Insertando en textarea/input');

            // Método React: obtener el setter nativo
            try {
                const prototype = element.tagName === 'TEXTAREA'
                    ? window.HTMLTextAreaElement.prototype
                    : window.HTMLInputElement.prototype;

                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

                // Limpiar primero
                nativeInputValueSetter.call(element, '');
                await sleep(50);

                // Insertar el texto
                nativeInputValueSetter.call(element, text);
                await sleep(100);

                console.log('Valor establecido:', element.value.substring(0, 50));
            } catch (e) {
                console.warn('Error con setter nativo:', e);
                element.value = text;
            }

            // Disparar eventos que React detecta
            const events = [
                new Event('focus', { bubbles: true }),
                new Event('click', { bubbles: true }),
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('input', { bubbles: true, cancelable: true }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true, cancelable: true }),
                new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
                new KeyboardEvent('keypress', { key: ' ', code: 'Space', bubbles: true, cancelable: true }),
                new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, cancelable: true })
            ];

            for (const event of events) {
                element.dispatchEvent(event);
                await sleep(30);
            }
        }

        // Forzar re-render final
        element.blur();
        await sleep(50);
        element.focus();
        await sleep(100);

        console.log('Inserción completada');
    }

    /**
     * Esperar a que aparezca un elemento en el DOM
     */
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            // Intentar encontrar el elemento inmediatamente
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            // Si no existe, usar MutationObserver
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    obs.disconnect();
                    reject(new Error(`Timeout esperando el selector: ${selector}`));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Timeout de seguridad
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout esperando el selector: ${selector}`));
            }, timeout);
        });
    }

    /**
     * Esperar la respuesta y extraerla
     */
    async function waitForResponse(selectors, aiType, maxWaitTime = 60000) {
        console.log(`Esperando respuesta de ${aiType}...`);

        const startTime = Date.now();
        let lastResponseLength = 0;
        let stableCount = 0;
        const stableThreshold = 3; // Necesita ser estable por 3 comprobaciones

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                try {
                    // Buscar el contenedor de respuesta
                    const responseElement = document.querySelector(selectors.lastResponse);

                    if (responseElement) {
                        const currentText = responseElement.innerText || responseElement.textContent;
                        const currentLength = currentText.length;

                        // Verificar si la respuesta ha dejado de crecer (ha terminado)
                        if (currentLength > 0) {
                            if (currentLength === lastResponseLength) {
                                stableCount++;

                                // Si ha sido estable por suficiente tiempo, considerarla completa
                                if (stableCount >= stableThreshold) {
                                    clearInterval(checkInterval);
                                    console.log(`Respuesta completa de ${aiType}:`, currentText.substring(0, 100) + '...');

                                    // Enviar la respuesta al background
                                    chrome.runtime.sendMessage({
                                        type: 'RESPONSE_EXTRACTED',
                                        aiType: aiType,
                                        response: currentText
                                    });

                                    resolve(currentText);
                                }
                            } else {
                                // La respuesta sigue creciendo
                                stableCount = 0;
                                lastResponseLength = currentLength;
                            }
                        }
                    }

                    // Timeout
                    if (Date.now() - startTime > maxWaitTime) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout esperando la respuesta completa'));
                    }

                } catch (error) {
                    clearInterval(checkInterval);
                    reject(error);
                }
            }, 1000); // Comprobar cada segundo
        });
    }

    /**
     * Función auxiliar para esperar
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('Content script listo para recibir prompts');
}
