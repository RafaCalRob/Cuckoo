/**
 * Content Script - API Directa
 * Usa las APIs internas de las IAs aprovechando las sesiones del navegador
 */

if (!window.multiChatAIDirectAPI) {
    window.multiChatAIDirectAPI = true;

    console.log('[Multi-Chat AI Direct API] Cargado');

    /**
     * Detectar tipo de IA por URL
     */
    function detectAIType() {
        const url = window.location.href;
        if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'chatgpt';
        if (url.includes('gemini.google.com')) return 'gemini';
        if (url.includes('claude.ai')) return 'claude';
        return null;
    }

    /**
     * Estado para tracking de conversaciones
     */
    const state = {
        chatgpt: {
            accessToken: null,
            conversationId: null,
            parentMessageId: null
        },
        gemini: {
            sessionId: null,
            conversationId: null,  // c_xxx
            responseId: null,      // r_xxx
            choiceId: null         // rc_xxx
        },
        claude: {
            organizationId: null,
            conversationId: null
        }
    };

    /**
     * Escuchar mensajes del background
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Multi-Chat AI Direct API] Mensaje recibido:', message);

        if (message.type === 'SEND_PROMPT_DIRECT_API') {
            const aiType = detectAIType();
            console.log('[Direct API] Tipo de IA detectado:', aiType);

            if (!aiType) {
                console.error('[Direct API] No se pudo detectar el tipo de IA. URL:', window.location.href);
                sendResponse({ success: false, error: 'No se detectó el tipo de IA' });
                return true;
            }

            console.log('[Direct API] Llamando a handleSendPromptDirectAPI...');

            handleSendPromptDirectAPI(message.prompt, aiType)
                .then(() => {
                    console.log('[Direct API] ✓ Prompt enviado exitosamente');
                    sendResponse({ success: true });
                })
                .catch(error => {
                    console.error('[Direct API] ❌ Error:', error);
                    console.error('[Direct API] Error stack:', error.stack);
                    sendResponse({ success: false, error: error.message });
                });

            return true; // Async response
        } else {
            console.log('[Direct API] Tipo de mensaje no reconocido:', message.type);
        }
    });

    /**
     * Enviar prompt usando API directa según el tipo de IA
     */
    async function handleSendPromptDirectAPI(prompt, aiType) {
        console.log(`[Direct API] Enviando a ${aiType}...`);

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
     * ========================================
     * CHATGPT API
     * ========================================
     */
    async function sendToChatGPTAPI(prompt) {
        console.log('[ChatGPT API] Enviando prompt...');

        try {
            // Paso 1: Obtener access token
            if (!state.chatgpt.accessToken) {
                await getChatGPTSession();
            }

            // Paso 2: Obtener requirements (turnstile token, etc)
            const requirements = await getChatGPTRequirements();

            // Paso 3: Enviar el prompt a la API
            await sendChatGPTMessage(prompt, requirements);

            console.log('[ChatGPT API] ✓ Enviado exitosamente');
        } catch (error) {
            console.error('[ChatGPT API] Error:', error);
            // Notificar error
            chrome.runtime.sendMessage({
                type: 'EXTRACTION_ERROR',
                aiType: 'chatgpt',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Obtener sesión de ChatGPT
     */
    async function getChatGPTSession() {
        console.log('[ChatGPT API] Obteniendo sesión...');

        const response = await fetch('https://chatgpt.com/api/auth/session', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la sesión. ¿Estás autenticado?');
        }

        const data = await response.json();
        state.chatgpt.accessToken = data.accessToken;

        console.log('[ChatGPT API] ✓ Sesión obtenida');
        return data;
    }

    /**
     * Obtener requirements (turnstile, proof token, etc)
     */
    async function getChatGPTRequirements() {
        console.log('[ChatGPT API] Obteniendo requirements...');

        const response = await fetch('https://chatgpt.com/backend-api/sentinel/chat-requirements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.chatgpt.accessToken}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudieron obtener los requirements');
        }

        const data = await response.json();
        console.log('[ChatGPT API] ✓ Requirements obtenidos');
        return data;
    }

    /**
     * Enviar mensaje a ChatGPT
     */
    async function sendChatGPTMessage(prompt, requirements) {
        console.log('[ChatGPT API] Enviando mensaje...');
        console.log('[ChatGPT API] Requirements:', requirements);

        const messageId = generateUUID();
        const parentMessageId = state.chatgpt.parentMessageId || generateUUID();

        const payload = {
            action: 'next',
            messages: [
                {
                    id: messageId,
                    author: { role: 'user' },
                    content: {
                        content_type: 'text',
                        parts: [prompt]
                    },
                    metadata: {}
                }
            ],
            parent_message_id: parentMessageId,
            model: 'auto',
            timezone_offset_min: new Date().getTimezoneOffset(),
            suggestions: [],
            history_and_training_disabled: false,
            conversation_mode: { kind: 'primary_assistant' },
            websocket_request_id: generateUUID()
        };

        // Si hay conversation_id, incluirlo
        if (state.chatgpt.conversationId) {
            payload.conversation_id = state.chatgpt.conversationId;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.chatgpt.accessToken}`,
            'Accept': 'text/event-stream'
        };

        // Agregar token de turnstile si existe
        if (requirements.token) {
            headers['Openai-Sentinel-Chat-Requirements-Token'] = requirements.token;
        }

        console.log('[ChatGPT API] Payload:', JSON.stringify(payload, null, 2));
        console.log('[ChatGPT API] Headers:', headers);

        const response = await fetch('https://chatgpt.com/backend-api/conversation', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        console.log('[ChatGPT API] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ChatGPT API] Error response:', errorText);

            // Detectar error 403 de anti-bot protection
            if (response.status === 403 && errorText.includes('Unusual activity')) {
                console.error('[ChatGPT API] ⚠️ Anti-bot protection activa. ChatGPT detectó comportamiento automatizado.');
                console.error('[ChatGPT API] Solución: Espera unos minutos y recarga la página de ChatGPT');
                throw new Error('ChatGPT bloqueó la petición (anti-bot). Espera unos minutos y recarga la página.');
            }

            throw new Error(`Error en la API: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        // Leer la respuesta en streaming
        await readChatGPTStream(response);
    }

    /**
     * Leer respuesta en streaming de ChatGPT
     */
    async function readChatGPTStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Procesar todas las líneas completas
                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            console.log('[ChatGPT API] Stream completado');
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            // Guardar conversation_id y message_id para la siguiente interacción
                            if (parsed.conversation_id) {
                                state.chatgpt.conversationId = parsed.conversation_id;
                            }

                            // Extraer el texto de la respuesta
                            const delta = parsed.message?.content?.parts?.[0];
                            if (delta && typeof delta === 'string') {
                                accumulatedText = delta;

                                // Enviar actualización en streaming
                                chrome.runtime.sendMessage({
                                    type: 'STREAMING_UPDATE',
                                    aiType: 'chatgpt',
                                    response: accumulatedText,
                                    isComplete: false
                                }).catch(() => {});

                                console.log(`[ChatGPT API] Streaming: ${accumulatedText.length} chars`);
                            }

                            // Guardar parent_message_id para la siguiente pregunta
                            if (parsed.message?.id) {
                                state.chatgpt.parentMessageId = parsed.message.id;
                            }

                            // Detectar fin del mensaje
                            if (parsed.message?.status === 'finished_successfully') {
                                console.log('[ChatGPT API] ✓ Respuesta completada');

                                // Enviar mensaje final
                                chrome.runtime.sendMessage({
                                    type: 'STREAMING_UPDATE',
                                    aiType: 'chatgpt',
                                    response: accumulatedText,
                                    isComplete: true
                                }).catch(() => {});

                                chrome.runtime.sendMessage({
                                    type: 'RESPONSE_EXTRACTED',
                                    aiType: 'chatgpt',
                                    response: accumulatedText
                                }).catch(() => {});
                            }

                        } catch (e) {
                            // Ignorar líneas que no sean JSON válido
                        }
                    }
                }

                // Mantener la última línea incompleta en el buffer
                buffer = lines[lines.length - 1];
            }

        } catch (error) {
            console.error('[ChatGPT API] Error leyendo stream:', error);
            throw error;
        }
    }

    /**
     * ========================================
     * GEMINI API
     * ========================================
     */
    async function sendToGeminiAPI(prompt) {
        console.log('[Gemini API] Enviando prompt...');

        try {
            // Extraer parámetros necesarios
            const bl = await extractGeminiBL();
            if (!bl) {
                throw new Error('No se pudo obtener el parámetro BL de Gemini');
            }

            const at = await extractGeminiAtToken();

            // Extraer IDs de conversación de la página
            await extractGeminiConversationIds();

            // Generar request ID (número aleatorio)
            const reqId = Math.floor(Math.random() * 1000000);

            // Construir URL SIMPLE como ChatHub (sin /u/, sin f.sid, sin hl, sin pageId)
            const apiUrl = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${bl}&_reqid=${reqId}&rt=c`;

            // Formato CORRECTO basado en ChatHub exitoso
            // [[prompt, 0, null, []], null, [conversationId, responseId, choiceId]]
            const requestPayload = [
                [prompt, 0, null, []],  // Prompt + parámetros básicos
                null,                    // Parámetro intermedio
                [
                    state.gemini.conversationId || "",  // c_xxx
                    state.gemini.responseId || "",      // r_xxx
                    state.gemini.choiceId || ""         // rc_xxx
                ]
            ];

            // Formato del body: f.req=[null, JSON.stringify(requestPayload)]
            const formData = new URLSearchParams();
            formData.append('f.req', JSON.stringify([null, JSON.stringify(requestPayload)]));
            formData.append('at', at || '');

            console.log('[Gemini API] URL:', apiUrl);
            console.log('[Gemini API] BL:', bl);
            console.log('[Gemini API] at token:', at ? at.substring(0, 30) + '...' : 'NO GENERADO');
            console.log('[Gemini API] Payload:', requestPayload);
            console.log('[Gemini API] Form data:', formData.toString());
            console.log('[Gemini API] Enviando a StreamGenerate...');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formData.toString(),
                credentials: 'include'
            });

            console.log('[Gemini API] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Gemini API] ❌ Error response:', errorText);
                console.error('[Gemini API] BL usado:', bl);
                console.error('[Gemini API] Payload enviado:', JSON.stringify(requestPayload));

                if (response.status === 400) {
                    console.error('[Gemini API] ⚠️ Error 400 - Payload incorrecto o parámetros inválidos');
                }

                throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`);
            }

            // Leer respuesta en streaming
            await readGeminiStream(response);

            console.log('[Gemini API] ✓ Enviado exitosamente');

        } catch (error) {
            console.error('[Gemini API] Error:', error);
            chrome.runtime.sendMessage({
                type: 'EXTRACTION_ERROR',
                aiType: 'gemini',
                error: error.message
            }).catch(() => {});
            throw error;
        }
    }

    /**
     * Leer respuesta en streaming de Gemini
     */
    async function readGeminiStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Gemini envía chunks en formato: <longitud>\n<json>\n
                const lines = buffer.split('\n');

                for (let i = 0; i < lines.length - 1; i += 2) {
                    const lengthLine = lines[i];
                    const jsonLine = lines[i + 1];

                    if (!jsonLine) continue;

                    try {
                        // El JSON viene como [["wrb.fr",null,"<json_string>"]]
                        const outerJson = JSON.parse(jsonLine);

                        if (outerJson[0] && outerJson[0][0] === 'wrb.fr' && outerJson[0][2]) {
                            // Parsear el JSON interno
                            const innerJson = JSON.parse(outerJson[0][2]);

                            // La respuesta está en: innerJson[4][0][1][0]
                            // Formato: [null, [conversationId, responseId], null, null, [[choiceId, [response], [], ...]]]
                            if (innerJson && innerJson[4] && innerJson[4][0]) {
                                const choice = innerJson[4][0];

                                // Guardar IDs para la siguiente interacción
                                if (choice[0]) {
                                    state.gemini.choiceId = choice[0];
                                }

                                // La respuesta está en choice[1][0]
                                if (choice[1] && choice[1][0]) {
                                    const responseText = choice[1][0];
                                    accumulatedText = responseText;

                                    // Enviar actualización
                                    chrome.runtime.sendMessage({
                                        type: 'STREAMING_UPDATE',
                                        aiType: 'gemini',
                                        response: accumulatedText,
                                        isComplete: false
                                    }).catch(() => {});

                                    console.log(`[Gemini API] Streaming: ${accumulatedText.length} chars`);
                                }

                                // Guardar conversationId y responseId
                                if (innerJson[1]) {
                                    state.gemini.conversationId = innerJson[1][0];
                                    state.gemini.responseId = innerJson[1][1];
                                }
                            }
                        }

                    } catch (e) {
                        // Ignorar líneas que no se puedan parsear
                        console.log('[Gemini API] Ignorando chunk inválido');
                    }
                }

                // Mantener las últimas líneas incompletas
                if (lines.length > 0) {
                    buffer = lines[lines.length - 1];
                }
            }

            // Enviar respuesta final
            if (accumulatedText) {
                chrome.runtime.sendMessage({
                    type: 'STREAMING_UPDATE',
                    aiType: 'gemini',
                    response: accumulatedText,
                    isComplete: true
                }).catch(() => {});

                chrome.runtime.sendMessage({
                    type: 'RESPONSE_EXTRACTED',
                    aiType: 'gemini',
                    response: accumulatedText
                }).catch(() => {});

                console.log('[Gemini API] ✓ Respuesta completada');
            }

        } catch (error) {
            console.error('[Gemini API] Error leyendo stream:', error);
            throw error;
        }
    }

    /**
     * Extraer parámetro BL de Gemini
     */
    async function extractGeminiBL() {
        // Buscar en los scripts de la página
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            const content = script.textContent;

            // Buscar el patrón del BL en el código
            const blMatch = content.match(/boq_assistant-bard-web-server_[\d.]+_[\w\d]+/);
            if (blMatch) {
                return blMatch[0];
            }
        }

        // Buscar en la URL de los scripts
        for (const script of scripts) {
            if (script.src && script.src.includes('boq_assistant-bard')) {
                const match = script.src.match(/boq_assistant-bard-web-server_[\d.]+_[\w\d]+/);
                if (match) return match[0];
            }
        }

        return null;
    }

    /**
     * Extraer token SNlM0e de Gemini
     */
    async function extractGeminiSNlM0e() {
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            if (script.textContent.includes('SNlM0e')) {
                const match = script.textContent.match(/"SNlM0e":"([^"]+)"/);
                if (match) return match[1];
            }
        }
        return null;
    }

    /**
     * Extraer/Generar AT token de Gemini
     * El token "at" se genera a partir de SAPISID cookie
     */
    async function extractGeminiAtToken() {
        // Obtener la cookie SAPISID
        const cookies = document.cookie.split(';');
        let sapisid = null;

        for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith('SAPISID=') || trimmed.startsWith('__Secure-3PAPISID=')) {
                sapisid = trimmed.split('=')[1];
                break;
            }
        }

        if (!sapisid) {
            console.warn('[Gemini API] No se encontró cookie SAPISID');
            return null;
        }

        // Generar el token "at" usando SAPISID + timestamp + origin
        const timestamp = Date.now();
        const origin = 'https://gemini.google.com';

        // Crear el hash SHA-1: timestamp + " " + sapisid + " " + origin
        const message = `${timestamp} ${sapisid} ${origin}`;
        const hash = await sha1Hash(message);

        // Formato: hash:timestamp
        return `${hash}:${timestamp}`;
    }

    /**
     * Generar hash SHA-1 en formato SAPISIDHASH (base64url sin padding)
     */
    async function sha1Hash(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);

        // Convertir a base64
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBinary = String.fromCharCode(...hashArray);
        const hashBase64 = btoa(hashBinary);

        // Convertir a base64url (reemplazar +/ por -_ y quitar padding =)
        const hashBase64url = hashBase64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        return hashBase64url;
    }

    /**
     * Extraer IDs de conversación de Gemini
     * Busca c_xxx (conversationId), r_xxx (responseId), rc_xxx (choiceId)
     */
    async function extractGeminiConversationIds() {
        console.log('[Gemini API] Extrayendo IDs de conversación...');

        try {
            // Método 1: Buscar en los scripts inline de la página
            const scripts = document.getElementsByTagName('script');

            for (const script of scripts) {
                const content = script.textContent;

                // Buscar patrones de IDs en el contenido
                // Formato: "c_xxxxx", "r_xxxxx", "rc_xxxxx"

                // Conversation ID (c_)
                if (!state.gemini.conversationId) {
                    const cMatch = content.match(/"c_([a-f0-9]+)"/);
                    if (cMatch) {
                        state.gemini.conversationId = `c_${cMatch[1]}`;
                        console.log('[Gemini API] Conversation ID encontrado:', state.gemini.conversationId);
                    }
                }

                // Response ID (r_)
                if (!state.gemini.responseId) {
                    const rMatch = content.match(/"r_([a-f0-9]+)"/);
                    if (rMatch) {
                        state.gemini.responseId = `r_${rMatch[1]}`;
                        console.log('[Gemini API] Response ID encontrado:', state.gemini.responseId);
                    }
                }

                // Choice ID (rc_)
                if (!state.gemini.choiceId) {
                    const rcMatch = content.match(/"rc_([a-f0-9]+)"/);
                    if (rcMatch) {
                        state.gemini.choiceId = `rc_${rcMatch[1]}`;
                        console.log('[Gemini API] Choice ID encontrado:', state.gemini.choiceId);
                    }
                }

                // Si encontramos los 3, salir del loop
                if (state.gemini.conversationId && state.gemini.responseId && state.gemini.choiceId) {
                    break;
                }
            }

            // Método 2: Buscar en la URL si hay una conversación activa
            const urlParams = new URLSearchParams(window.location.search);

            // Método 3: Buscar en WIZ_global_data (estructura común de Google)
            if (window.WIZ_global_data) {
                try {
                    const wizData = JSON.stringify(window.WIZ_global_data);

                    if (!state.gemini.conversationId) {
                        const cMatch = wizData.match(/"c_([a-f0-9]+)"/);
                        if (cMatch) state.gemini.conversationId = `c_${cMatch[1]}`;
                    }

                    if (!state.gemini.responseId) {
                        const rMatch = wizData.match(/"r_([a-f0-9]+)"/);
                        if (rMatch) state.gemini.responseId = `r_${rMatch[1]}`;
                    }

                    if (!state.gemini.choiceId) {
                        const rcMatch = wizData.match(/"rc_([a-f0-9]+)"/);
                        if (rcMatch) state.gemini.choiceId = `rc_${rcMatch[1]}`;
                    }
                } catch (e) {
                    console.warn('[Gemini API] Error parseando WIZ_global_data:', e);
                }
            }

            // Logging del estado final
            if (state.gemini.conversationId || state.gemini.responseId || state.gemini.choiceId) {
                console.log('[Gemini API] IDs extraídos:', {
                    conversationId: state.gemini.conversationId || 'null',
                    responseId: state.gemini.responseId || 'null',
                    choiceId: state.gemini.choiceId || 'null'
                });
            } else {
                console.log('[Gemini API] No se encontraron IDs - Nueva conversación (se usarán strings vacíos)');
            }

        } catch (error) {
            console.warn('[Gemini API] Error extrayendo IDs:', error);
            // No lanzar error - simplemente usar valores null/empty
        }
    }

    /**
     * Extraer f.sid (FID/Session ID) de Gemini
     */
    async function extractGeminiFSID() {
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            // Buscar patrón: "FdrFJe":"número_largo"
            if (script.textContent.includes('FdrFJe')) {
                const match = script.textContent.match(/"FdrFJe":"(\d+)"/);
                if (match) return match[1];
            }
        }

        // Intentar extraer de la URL actual si hay conversaciones previas
        const urlMatch = window.location.href.match(/f\.sid=(\d+)/);
        if (urlMatch) return urlMatch[1];

        return null;
    }

    /**
     * ========================================
     * CLAUDE API
     * ========================================
     */
    async function sendToClaudeAPI(prompt) {
        console.log('[Claude API] Enviando prompt...');

        try {
            // Paso 1: Obtener organization ID
            if (!state.claude.organizationId) {
                await getClaudeOrganization();
            }

            // Paso 2: Crear o obtener conversación
            if (!state.claude.conversationId) {
                await createClaudeConversation();
            }

            // Paso 3: Enviar el mensaje
            await sendClaudeMessage(prompt);

            console.log('[Claude API] ✓ Enviado exitosamente');

        } catch (error) {
            console.error('[Claude API] Error:', error);
            chrome.runtime.sendMessage({
                type: 'EXTRACTION_ERROR',
                aiType: 'claude',
                error: error.message
            }).catch(() => {});
            throw error;
        }
    }

    /**
     * Obtener organization ID de Claude
     */
    async function getClaudeOrganization() {
        const response = await fetch('https://claude.ai/api/organizations', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la organización. ¿Estás autenticado?');
        }

        const orgs = await response.json();
        if (orgs.length === 0) {
            throw new Error('No se encontró ninguna organización');
        }

        state.claude.organizationId = orgs[0].uuid;
        console.log('[Claude API] ✓ Organization ID obtenida');
    }

    /**
     * Crear conversación en Claude
     */
    async function createClaudeConversation() {
        const response = await fetch(`https://claude.ai/api/organizations/${state.claude.organizationId}/chat_conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: '',
                uuid: generateUUID()
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudo crear la conversación');
        }

        const data = await response.json();
        state.claude.conversationId = data.uuid;
        console.log('[Claude API] ✓ Conversación creada');
    }

    /**
     * Enviar mensaje a Claude
     */
    async function sendClaudeMessage(prompt) {
        const payload = {
            prompt: prompt,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            attachments: [],
            files: []
        };

        const response = await fetch(
            `https://claude.ai/api/organizations/${state.claude.organizationId}/chat_conversations/${state.claude.conversationId}/completion`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        // Leer respuesta en streaming
        await readClaudeStream(response);
    }

    /**
     * Leer respuesta en streaming de Claude
     */
    async function readClaudeStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                for (let i = 0; i < lines.length - 1; i++) {
                    const line = lines[i].trim();

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.completion) {
                                accumulatedText = parsed.completion;

                                // Enviar actualización
                                chrome.runtime.sendMessage({
                                    type: 'STREAMING_UPDATE',
                                    aiType: 'claude',
                                    response: accumulatedText,
                                    isComplete: false
                                }).catch(() => {});

                                console.log(`[Claude API] Streaming: ${accumulatedText.length} chars`);
                            }

                            if (parsed.stop_reason) {
                                console.log('[Claude API] ✓ Respuesta completada');

                                chrome.runtime.sendMessage({
                                    type: 'STREAMING_UPDATE',
                                    aiType: 'claude',
                                    response: accumulatedText,
                                    isComplete: true
                                }).catch(() => {});

                                chrome.runtime.sendMessage({
                                    type: 'RESPONSE_EXTRACTED',
                                    aiType: 'claude',
                                    response: accumulatedText
                                }).catch(() => {});
                            }

                        } catch (e) {
                            // Ignorar líneas inválidas
                        }
                    }
                }

                buffer = lines[lines.length - 1];
            }

        } catch (error) {
            console.error('[Claude API] Error leyendo stream:', error);
            throw error;
        }
    }

    /**
     * ========================================
     * UTILIDADES
     * ========================================
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    console.log('[Multi-Chat AI Direct API] ✓ Listo');
}
