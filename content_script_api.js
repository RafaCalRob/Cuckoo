/**
 * Content Script API - Usa las APIs directas de las IAs
 * Aprovecha las sesiones existentes del navegador
 */

if (!window.multiChatAIAPIInjected) {
    window.multiChatAIAPIInjected = true;

    console.log('[Multi-Chat AI API] Content script cargado');

    /**
     * Detectar tipo de IA por la URL actual
     */
    function detectAIType() {
        const url = window.location.href;
        if (url.includes('chatgpt.com') || url.includes('openai.com')) return 'chatgpt';
        if (url.includes('gemini.google.com')) return 'gemini';
        if (url.includes('claude.ai')) return 'claude';
        return null;
    }

    /**
     * Escuchar mensajes del background
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'INJECT_PROMPT_API') {
            const aiType = detectAIType();
            if (!aiType) {
                sendResponse({ success: false, error: 'Tipo de IA no detectado' });
                return true;
            }

            handleSendPromptAPI(message.prompt, aiType)
                .then(() => sendResponse({ success: true }))
                .catch((error) => {
                    console.error('[Multi-Chat AI API] Error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        }

        if (message.type === 'GET_RESPONSE') {
            const aiType = detectAIType();
            extractLatestResponse(aiType)
                .then(response => sendResponse({ success: true, response }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        }
    });

    /**
     * Enviar prompt usando la API directa
     */
    async function handleSendPromptAPI(prompt, aiType) {
        console.log(`[Multi-Chat AI API] Enviando a ${aiType} vía API`);

        switch (aiType) {
            case 'chatgpt':
                return await sendToChatGPTAPI(prompt);
            case 'gemini':
                return await sendToGeminiAPI(prompt);
            case 'claude':
                return await sendToClaudeAPI(prompt);
            default:
                throw new Error('IA no soportada');
        }
    }

    /**
     * ChatGPT API
     */
    async function sendToChatGPTAPI(prompt) {
        console.log('[ChatGPT API] Enviando prompt...');

        try {
            // Obtener el access token y conversation ID
            const accessToken = await getChatGPTAccessToken();

            const payload = {
                action: "next",
                messages: [{
                    id: generateUUID(),
                    author: { role: "user" },
                    content: {
                        content_type: "text",
                        parts: [prompt]
                    }
                }],
                model: "text-davinci-002-render-sha",
                parent_message_id: generateUUID(),
                timezone_offset_min: new Date().getTimezoneOffset()
            };

            const response = await fetch('https://chatgpt.com/backend-api/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`ChatGPT API error: ${response.status}`);
            }

            // Leer respuesta en streaming
            await readStreamingResponse(response, 'chatgpt');

            console.log('[ChatGPT API] ✓ Enviado');
        } catch (error) {
            console.error('[ChatGPT API] Error:', error);
            throw error;
        }
    }

    /**
     * Obtener access token de ChatGPT
     */
    async function getChatGPTAccessToken() {
        try {
            const response = await fetch('https://chatgpt.com/api/auth/session', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.accessToken;
        } catch (error) {
            console.error('[ChatGPT] Error obteniendo token:', error);
            throw new Error('No se pudo obtener el token de ChatGPT. ¿Estás autenticado?');
        }
    }

    /**
     * Gemini API
     */
    async function sendToGeminiAPI(prompt) {
        console.log('[Gemini API] Enviando prompt...');

        try {
            // Gemini usa una API interna más compleja
            // Alternativa: Usar el método de inyección DOM
            await injectPromptWithDOM('gemini', prompt);

            // Observar la respuesta
            setTimeout(() => {
                observeResponse('gemini');
            }, 2000);

        } catch (error) {
            console.error('[Gemini API] Error:', error);
            throw error;
        }
    }

    /**
     * Claude API
     */
    async function sendToClaudeAPI(prompt) {
        console.log('[Claude API] Enviando prompt...');

        try {
            // Obtener organization ID de la URL o localStorage
            const orgId = await getClaudeOrgId();
            const conversationId = await getOrCreateClaudeConversation(orgId);

            const payload = {
                prompt: prompt,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                model: "claude-3-5-sonnet-20241022"
            };

            const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations/${conversationId}/completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            // Leer respuesta en streaming
            await readStreamingResponse(response, 'claude');

            console.log('[Claude API] ✓ Enviado');
        } catch (error) {
            console.error('[Claude API] Error:', error);
            throw error;
        }
    }

    /**
     * Obtener Organization ID de Claude
     */
    async function getClaudeOrgId() {
        try {
            const response = await fetch('https://claude.ai/api/organizations', {
                credentials: 'include'
            });
            const orgs = await response.json();
            return orgs[0]?.uuid || null;
        } catch (error) {
            console.error('[Claude] Error obteniendo org ID:', error);
            throw new Error('No se pudo obtener el organization ID de Claude');
        }
    }

    /**
     * Obtener o crear conversación en Claude
     */
    async function getOrCreateClaudeConversation(orgId) {
        try {
            // Intentar obtener conversaciones existentes
            const response = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations`, {
                credentials: 'include'
            });
            const conversations = await response.json();

            if (conversations.length > 0) {
                return conversations[0].uuid;
            }

            // Crear nueva conversación
            const createResponse = await fetch(`https://claude.ai/api/organizations/${orgId}/chat_conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: 'Multi-Chat AI' }),
                credentials: 'include'
            });
            const newConv = await createResponse.json();
            return newConv.uuid;
        } catch (error) {
            console.error('[Claude] Error con conversación:', error);
            throw error;
        }
    }

    /**
     * Leer respuesta en streaming (Server-Sent Events)
     */
    async function readStreamingResponse(response, aiType) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const text = extractTextFromChunk(data, aiType);
                            if (text) {
                                accumulatedText += text;

                                // Enviar actualización en streaming al background
                                chrome.runtime.sendMessage({
                                    type: 'STREAMING_UPDATE',
                                    aiType: aiType,
                                    response: accumulatedText,
                                    isComplete: false
                                }).catch(() => {});
                            }
                        } catch (e) {
                            // Ignorar chunks que no sean JSON
                        }
                    }
                }
            }

            // Enviar respuesta final
            chrome.runtime.sendMessage({
                type: 'STREAMING_UPDATE',
                aiType: aiType,
                response: accumulatedText,
                isComplete: true
            }).catch(() => {});

        } catch (error) {
            console.error('[Streaming] Error:', error);
        }
    }

    /**
     * Extraer texto del chunk según la IA
     */
    function extractTextFromChunk(data, aiType) {
        switch (aiType) {
            case 'chatgpt':
                return data?.message?.content?.parts?.[0] || '';
            case 'claude':
                return data?.completion || '';
            default:
                return '';
        }
    }

    /**
     * Método alternativo: Inyectar en DOM y observar (fallback)
     */
    async function injectPromptWithDOM(aiType, prompt) {
        const selectors = getSelectorsForAI(aiType);
        const inputField = await findElement(selectors.input);
        const submitButton = await findElement(selectors.submit);

        if (!inputField || !submitButton) {
            throw new Error('No se encontraron los elementos necesarios');
        }

        // Insertar texto
        if (inputField.contentEditable === 'true') {
            inputField.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, prompt);
        } else {
            inputField.value = prompt;
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await sleep(500);
        submitButton.click();
    }

    /**
     * Observar respuesta en el DOM
     */
    function observeResponse(aiType) {
        const selectors = getSelectorsForAI(aiType);

        const observer = new MutationObserver(() => {
            const responseElement = document.querySelector(selectors.response);
            if (responseElement) {
                const text = responseElement.innerText || responseElement.textContent;

                chrome.runtime.sendMessage({
                    type: 'STREAMING_UPDATE',
                    aiType: aiType,
                    response: text,
                    isComplete: false
                }).catch(() => {});
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Detener después de 60 segundos
        setTimeout(() => observer.disconnect(), 60000);
    }

    /**
     * Extraer última respuesta del DOM
     */
    async function extractLatestResponse(aiType) {
        const selectors = getSelectorsForAI(aiType);
        await sleep(2000); // Esperar a que se genere la respuesta

        const responseElement = document.querySelector(selectors.response);
        if (!responseElement) {
            throw new Error('No se encontró la respuesta');
        }

        return responseElement.innerText || responseElement.textContent;
    }

    /**
     * Obtener selectores por IA
     */
    function getSelectorsForAI(aiType) {
        const configs = {
            chatgpt: {
                input: '#prompt-textarea, textarea[placeholder*="Message"]',
                submit: 'button[data-testid="send-button"]',
                response: '[data-message-author-role="assistant"]:last-of-type'
            },
            gemini: {
                input: 'rich-textarea, .ql-editor[contenteditable="true"]',
                submit: 'button[aria-label*="Send"]',
                response: 'model-response:last-of-type, .model-response-text:last-of-type'
            },
            claude: {
                input: 'div.ProseMirror[contenteditable="true"]',
                submit: 'button[aria-label="Send Message"]',
                response: 'div[data-is-streaming="false"]:last-of-type'
            }
        };
        return configs[aiType] || {};
    }

    /**
     * Utilidades
     */
    function findElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Timeout esperando elemento'));
            }, timeout);
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    console.log('[Multi-Chat AI API] ✓ Listo');
}
