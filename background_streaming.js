/**
 * Background Script con Streaming + Nuevas Funcionalidades
 * - Streaming en tiempo real
 * - Context menu (click derecho)
 * - Sidebar flotante
 * - Resumir página
 */

// Configuración de las IAs
const AI_CONFIGS = {
    chatgpt: {
        url: 'https://chatgpt.com',
        urlPattern: '*://chatgpt.com/*',
        name: 'ChatGPT'
    },
    gemini: {
        url: 'https://gemini.google.com/app',
        urlPattern: '*://gemini.google.com/*',
        name: 'Gemini'
    },
    claude: {
        url: 'https://claude.ai/new',
        urlPattern: '*://claude.ai/*',
        name: 'Claude'
    },
    meta: {
        url: 'https://www.meta.ai',
        urlPattern: '*://www.meta.ai/*',
        name: 'Meta AI'
    },
    grok: {
        url: 'https://x.com/i/grok',
        urlPattern: '*://x.com/i/grok*',
        name: 'Grok'
    },
    perplexity: {
        url: 'https://www.perplexity.ai',
        urlPattern: '*://www.perplexity.ai/*',
        name: 'Perplexity'
    }
};

/**
 * Crear context menus (click derecho)
 */
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Multi-Chat AI] Extensión instalada, creando menus...');

    // Menu principal
    chrome.contextMenus.create({
        id: 'multi-chat-ai',
        title: 'Multi-Chat AI',
        contexts: ['selection', 'page']
    });

    // Sub-menu: Enviar selección a todas las IAs
    chrome.contextMenus.create({
        id: 'send-to-all',
        parentId: 'multi-chat-ai',
        title: 'Enviar a todas las IAs',
        contexts: ['selection']
    });

    // Sub-menu: Resumir página actual
    chrome.contextMenus.create({
        id: 'summarize-page',
        parentId: 'multi-chat-ai',
        title: 'Resumir esta página',
        contexts: ['page']
    });

    // Sub-menu: Explicar selección
    chrome.contextMenus.create({
        id: 'explain-selection',
        parentId: 'multi-chat-ai',
        title: 'Explicar esto',
        contexts: ['selection']
    });

    // Sub-menu: Traducir selección
    chrome.contextMenus.create({
        id: 'translate-selection',
        parentId: 'multi-chat-ai',
        title: 'Traducir al español',
        contexts: ['selection']
    });

    // Sub-menu: Abrir sidebar
    chrome.contextMenus.create({
        id: 'open-sidebar',
        parentId: 'multi-chat-ai',
        title: 'Abrir Chat Sidebar',
        contexts: ['page']
    });

    console.log('[Multi-Chat AI] ✓ Context menus creados');
});

/**
 * Manejar clicks en el context menu
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('[Multi-Chat AI] Context menu clicked:', info.menuItemId);

    switch (info.menuItemId) {
        case 'send-to-all':
            if (info.selectionText) {
                handleSendPrompt(info.selectionText, ['chatgpt', 'gemini', 'claude']);
            }
            break;

        case 'summarize-page':
            handleSummarizePage(tab);
            break;

        case 'explain-selection':
            if (info.selectionText) {
                const prompt = `Explica esto de forma clara y concisa:\n\n${info.selectionText}`;
                handleSendPrompt(prompt, ['chatgpt', 'gemini', 'claude']);
            }
            break;

        case 'translate-selection':
            if (info.selectionText) {
                const prompt = `Traduce esto al español:\n\n${info.selectionText}`;
                handleSendPrompt(prompt, ['chatgpt', 'gemini', 'claude']);
            }
            break;

        case 'open-sidebar':
            handleOpenSidebar(tab);
            break;
    }
});

/**
 * Abrir la página principal cuando se hace click en el icono
 */
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
    });
});

/**
 * Listener de mensajes
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Multi-Chat AI] Mensaje recibido:', message.type);

    // Mensajes desde la UI
    if (message.type === 'SEND_PROMPT') {
        handleSendPrompt(message.prompt, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    else if (message.type === 'SEND_CUSTOM_PROMPTS') {
        handleCustomPrompts(message.prompts, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    // Mensajes de streaming desde content scripts
    else if (message.type === 'STREAMING_UPDATE') {
        // Reenviar a la UI en tiempo real
        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: message.aiType,
            response: message.response,
            isComplete: message.isComplete
        }).catch(err => {
            // Ignorar error si no hay receptor
        });
        sendResponse({ received: true });
    }
    // Mensaje final de respuesta completa
    else if (message.type === 'RESPONSE_EXTRACTED') {
        chrome.runtime.sendMessage({
            type: 'RESPONSE_RECEIVED',
            ai: message.aiType,
            response: message.response
        }).catch(err => {});
        sendResponse({ received: true });
    }
    else if (message.type === 'EXTRACTION_ERROR') {
        chrome.runtime.sendMessage({
            type: 'ERROR',
            ai: message.aiType,
            error: message.error
        }).catch(err => {});
        sendResponse({ received: true });
    }
    // Comandos de sidebar
    else if (message.type === 'TOGGLE_SIDEBAR') {
        handleToggleSidebar(sender.tab);
        sendResponse({ success: true });
    }

    return true;
});

/**
 * Manejar envío de prompt - PETICIONES DIRECTAS (como ChatHub)
 * NO necesita abrir pestañas, hace fetch directo desde background
 */
async function handleSendPrompt(prompt, selectedAIs) {
    console.log('[Multi-Chat AI] Enviando prompt a', selectedAIs.length, 'IAs (peticiones directas)');

    try {
        // Enviar a todas las IAs en paralelo
        const sendPromises = selectedAIs.map(async (aiType) => {
            try {
                console.log(`[Multi-Chat AI] Enviando a ${aiType}...`);

                if (aiType === 'gemini') {
                    await sendToGeminiDirect(prompt);
                } else if (aiType === 'chatgpt') {
                    await sendToChatGPTDirect(prompt);
                } else if (aiType === 'perplexity') {
                    await sendToPerplexityDirect(prompt);
                } else if (aiType === 'mistral') {
                    await sendToMistralDirect(prompt);
                } else if (aiType === 'deepseek') {
                    await sendToDeepSeekDirect(prompt);
                }

                return { aiType, success: true };
            } catch (error) {
                console.error(`[Multi-Chat AI] Error en ${aiType}:`, error);
                chrome.runtime.sendMessage({
                    type: 'ERROR',
                    ai: aiType,
                    error: error.message || 'Error desconocido'
                }).catch(() => {});
                return { aiType, success: false, error: error.message };
            }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        console.log(`[Multi-Chat AI] ✓ Enviado a ${successCount}/${selectedAIs.length} IAs`);
        chrome.runtime.sendMessage({ type: 'ALL_SENT' }).catch(() => {});

    } catch (error) {
        console.error('[Multi-Chat AI] Error:', error);
        chrome.runtime.sendMessage({
            type: 'ERROR',
            ai: 'general',
            error: error.message
        });
    }
}

/**
 * ========================================
 * PETICIONES DIRECTAS DESDE BACKGROUND
 * ========================================
 */

/**
 * ========================================
 * CÓDIGO CLONADO DE CHATHUB 3.99.4_0
 * ========================================
 */

// Contexto de conversación de Gemini (mantener entre mensajes)
let geminiConversationContext = null;

/**
 * Generar ID aleatorio para requestId
 * Igual que Agt() en ChatHub
 */
function generateRequestId() {
    return Math.floor(Math.random() * 900000) + 100000;
}

/**
 * Extraer valor con regex del HTML
 * Igual que lM() en ChatHub
 */
function extractFromHTML(key, html) {
    const regex = new RegExp(`"${key}":"([^"]+)"`);
    const match = regex.exec(html);
    return match ? match[1] : null;
}

/**
 * Obtener parámetros de Gemini (AT y BL)
 * Igual que xgt() en ChatHub
 */
async function getGeminiParams() {
    console.log('[Gemini] Obteniendo parámetros...');

    try {
        const response = await fetch('https://gemini.google.com/', {
            credentials: 'include'
        });

        const html = await response.text();

        // Extraer SNlM0e (token AT) y cfb2h (BL value)
        const atValue = extractFromHTML('SNlM0e', html);
        const blValue = extractFromHTML('cfb2h', html);

        if (!atValue || !blValue) {
            throw new Error('No se pudieron extraer los tokens de Gemini');
        }

        console.log('[Gemini] Token AT:', atValue.substring(0, 20) + '...');
        console.log('[Gemini] BL:', blValue);

        return { atValue, blValue };

    } catch (error) {
        console.error('[Gemini] Error obteniendo parámetros:', error);
        throw error;
    }
}

/**
 * Parsear respuesta de Gemini
 * Igual que kgt() en ChatHub
 */
function parseGeminiResponse(line) {
    try {
        const parsed = JSON.parse(line);
        const data = JSON.parse(parsed[0][2]);

        if (!data) {
            throw new Error('Failed to load Gemini response');
        }

        const content = data[4][0];
        let responseText = content[1][0];

        // IDs para siguiente mensaje
        const ids = [...data[1], content[0]];

        return { text: responseText, ids };

    } catch (error) {
        throw error;
    }
}

/**
 * Parsear múltiples líneas de respuesta
 * Igual que Cgt() en ChatHub
 */
function parseGeminiFullResponse(responseText) {
    const lines = responseText.split('\n');

    for (const line of lines) {
        if (line.trim().length === 0) continue;

        try {
            return parseGeminiResponse(line);
        } catch (e) {
            // Continuar con siguiente línea
            continue;
        }
    }

    throw new Error('Failed to parse Gemini response');
}

/**
 * Enviar a Gemini - MÉTODO EXACTO DE CHATHUB
 * Igual que class Igt.doSendMessage() en ChatHub
 */
async function sendToGeminiDirect(prompt, image = null) {
    console.log('[Gemini] Enviando prompt...');

    try {
        // 1. Inicializar contexto si no existe
        if (!geminiConversationContext) {
            geminiConversationContext = {
                requestParams: await getGeminiParams(),
                contextIds: ["", "", ""]  // ← CLAVE: Strings vacíos, NO aleatorios
            };
        }

        const { requestParams, contextIds } = geminiConversationContext;

        // 2. Si hay imagen, subirla primero
        let imageId = null;
        if (image) {
            imageId = await uploadImageToGemini(image);
        }

        // 3. Construir payload EXACTO como ChatHub
        const payload = [
            null,
            JSON.stringify([
                [
                    prompt,                                    // El prompt
                    0,                                         // Parámetro fijo
                    null,                                      // Parámetro fijo
                    imageId ? [[[imageId, 1], image.name]] : []  // Array de imágenes
                ],
                null,                                          // Parámetro fijo
                contextIds                                     // Los 3 IDs de conversación
            ])
        ];

        // 4. Crear form data
        const formData = new URLSearchParams({
            "f.req": JSON.stringify(payload)
        });

        // Agregar token AT si existe
        if (requestParams.atValue) {
            formData.set("at", requestParams.atValue);
        }

        // 5. Generar request ID aleatorio
        const reqId = generateRequestId();

        // 6. Construir URL
        const url = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${requestParams.blValue}&_reqid=${reqId}&rt=c`;

        console.log('[Gemini] URL:', url);
        console.log('[Gemini] Payload f.req:', formData.get('f.req'));

        // 7. Hacer petición con credentials: 'include'
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formData.toString(),
            credentials: 'include'  // ← CLAVE: incluir cookies automáticamente
        });

        console.log('[Gemini] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Gemini] Error:', errorText);
            throw new Error(`Gemini error: ${response.status}`);
        }

        // 8. Leer respuesta
        const text = await response.text();
        const { text: responseText, ids: newIds } = parseGeminiFullResponse(text);

        // 9. Actualizar IDs de conversación para siguiente mensaje
        geminiConversationContext.contextIds = newIds;

        // 10. Enviar respuesta a UI
        chrome.runtime.sendMessage({
            type: 'RESPONSE_RECEIVED',
            ai: 'gemini',
            response: responseText
        }).catch(() => {});

        console.log('[Gemini] ✓ Respuesta:', responseText.substring(0, 100) + '...');

        return responseText;

    } catch (error) {
        console.error('[Gemini] Error:', error);
        throw error;
    }
}

/**
 * Resetear conversación de Gemini
 */
function resetGeminiConversation() {
    geminiConversationContext = null;
    console.log('[Gemini] Conversación reseteada');
}

/**
 * Subir imagen a Gemini
 * Igual que uploadImage() en ChatHub
 */
async function uploadImageToGemini(image) {
    console.log('[Gemini] Subiendo imagen...', image.name);

    const headers = {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'push-id': 'feeds/mcudyrk2a4khkz',
        'x-goog-upload-header-content-length': image.size.toString(),
        'x-goog-upload-protocol': 'resumable',
        'x-tenant-id': 'bard-storage'
    };

    try {
        // 1. Iniciar upload
        const startResponse = await fetch('https://content-push.googleapis.com/upload/', {
            method: 'POST',
            headers: {
                ...headers,
                'x-goog-upload-command': 'start'
            },
            body: new URLSearchParams({
                [`File name: ${image.name}`]: ''
            })
        });

        const uploadUrl = startResponse.headers.get('x-goog-upload-url');
        if (!uploadUrl) {
            throw new Error('Failed to get upload URL');
        }

        // 2. Subir archivo
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'x-goog-upload-command': 'upload, finalize',
                'x-goog-upload-offset': '0'
            },
            body: image
        });

        const imageId = await uploadResponse.text();
        console.log('[Gemini] Imagen subida:', imageId);

        return imageId;

    } catch (error) {
        console.error('[Gemini] Error subiendo imagen:', error);
        throw error;
    }
}

/**
 * ========================================
 * CHATGPT - CÓDIGO CLONADO DE CHATHUB
 * Adaptado para Manifest V3 (sin Worker)
 * ========================================
 */

// Contexto de conversación de ChatGPT
let chatgptConversationContext = {};

/**
 * Importar librería SHA3 (js-sha3)
 * Versión local para Manifest V3
 */
try {
    importScripts('sha3.js');
    console.log('[ChatGPT] SHA3 library loaded');
} catch (error) {
    console.error('[ChatGPT] Failed to load SHA3:', error);
}

/**
 * Obtener configuración del navegador para proof-of-work
 * Adaptado para Service Workers (sin screen, window, etc.)
 */
function getBrowserConfig() {
    // Service Workers no tienen acceso a screen, window, document
    // Usar valores por defecto que funcionan
    const cores = navigator.hardwareConcurrency || 4;
    const screenWidth = 1920; // Valor por defecto
    const screenHeight = 1080; // Valor por defecto

    return [
        cores + screenWidth + screenHeight, // 3004 típicamente
        new Date().toString(),
        0, // performance.memory no disponible en SW
        0,
        navigator.userAgent,
        "",
        "",
        navigator.language,
        navigator.languages.join(","),
        0
    ];
}

/**
 * Codificar config en base64
 */
function encodeConfig(config) {
    const jsonStr = JSON.stringify(config);
    const bytes = new TextEncoder().encode(jsonStr);
    return btoa(String.fromCharCode(...bytes));
}

/**
 * Calcular proof-of-work INLINE (sin Worker)
 * Adaptado para Manifest V3
 */
function calculateProofOfWorkSync(seed, difficulty, config) {
    const startTime = performance.now();
    const maxIterations = 500000;

    for (let i = 0; i < maxIterations; i++) {
        config[3] = i;
        config[9] = Math.round(performance.now() - startTime);

        const encoded = encodeConfig(config);
        const hash = sha3_512(seed + encoded);

        // Comparar hash con difficulty
        if (hash.slice(0, difficulty.length) <= difficulty) {
            return encoded;
        }
    }

    // Fallback si no se encuentra solución
    return "wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4De";
}

/**
 * Calcular proof-of-work (versión async para compatibilidad)
 */
async function calculateProofOfWork(seed, difficulty) {
    console.log('[ChatGPT] Calculando proof-of-work inline (puede tardar unos segundos)...');

    const config = getBrowserConfig();

    // Ejecutar en un setTimeout para no bloquear completamente
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = calculateProofOfWorkSync(seed, difficulty, config);
            resolve(result);
        }, 10);
    });
}

// Cache de proof tokens
const proofTokenCache = new Map();

/**
 * Generar proof token complejo (gAAAAAB)
 * Igual que h0t() en ChatHub
 */
async function generateComplexProofToken(seed, difficulty) {
    if (!proofTokenCache.has(seed)) {
        const token = await calculateProofOfWork(seed, difficulty);
        proofTokenCache.set(seed, token);
    }
    return "gAAAAAB" + proofTokenCache.get(seed);
}

/**
 * Generar proof token simple (gAAAAAC)
 * Igual que m0t() en ChatHub
 */
async function generateSimpleProofToken(seed) {
    if (!proofTokenCache.has(seed)) {
        const token = await calculateProofOfWork(seed, "0");
        proofTokenCache.set(seed, token);
    }
    return "gAAAAAC" + proofTokenCache.get(seed);
}

/**
 * Obtener Device ID persistente
 * Adaptado para usar chrome.storage en lugar de localStorage
 */
async function getDeviceId() {
    try {
        const result = await chrome.storage.local.get(['oai_device_id']);
        let deviceId = result.oai_device_id;

        if (!deviceId) {
            deviceId = generateUUID();
            await chrome.storage.local.set({ 'oai_device_id': deviceId });
            console.log('[ChatGPT] Device ID creado:', deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('[ChatGPT] Error obteniendo device ID:', error);
        // Fallback: generar uno temporal
        return generateUUID();
    }
}

/**
 * Obtener language
 */
function getLanguage() {
    return "en-US";
}

/**
 * Generar UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Obtener Access Token de ChatGPT
 * Igual que getAccessToken() en ChatHub
 */
async function getChatGPTAccessToken() {
    try {
        console.log('[ChatGPT] Obteniendo access token...');

        const response = await fetch('https://chatgpt.com/api/auth/session', {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.error === 'RefreshAccessTokenError') {
            throw new Error('Please login to ChatGPT');
        }

        console.log('[ChatGPT] Access token obtenido');
        return data.accessToken;

    } catch (error) {
        if (error.status === 403) {
            throw new Error('Please pass Cloudflare check');
        }
        throw error;
    }
}

/**
 * Obtener chat requirements
 * Igual que chatRequirements() en ChatHub
 */
async function getChatRequirements(accessToken) {
    console.log('[ChatGPT] Obteniendo chat requirements...');

    const simpleProof = await generateSimpleProofToken("" + Math.random());
    const deviceId = await getDeviceId();

    const response = await fetch('https://chatgpt.com/backend-api/sentinel/chat-requirements', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Oai-Device-Id': deviceId,
            'Oai-Language': getLanguage(),
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ p: simpleProof }),
        credentials: 'include'
    });

    const data = await response.json();
    console.log('[ChatGPT] Chat requirements obtenidos');

    return data;
}

/**
 * Subir imagen a ChatGPT
 */
async function uploadImageToChatGPT(accessToken, image) {
    console.log('[ChatGPT] Subiendo imagen...', image.name);

    // 1. Crear upload
    const createResponse = await fetch('https://chatgpt.com/backend-api/files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            file_name: image.name,
            file_size: image.size,
            use_case: 'multimodal'
        }),
        credentials: 'include'
    });

    const createData = await createResponse.json();

    if (createData.status !== 'success') {
        throw new Error('Failed to init ChatGPT file upload');
    }

    // 2. Subir archivo
    await fetch(createData.upload_url, {
        method: 'PUT',
        headers: {
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-version': '2020-04-08',
            'Content-Type': image.type
        },
        body: image
    });

    // 3. Completar upload
    await fetch(`https://chatgpt.com/backend-api/files/${createData.file_id}/uploaded`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({}),
        credentials: 'include'
    });

    console.log('[ChatGPT] Imagen subida:', createData.file_id);
    return createData.file_id;
}

/**
 * Construir mensaje de ChatGPT
 */
function buildChatGPTMessage(prompt, imageData = null) {
    return {
        id: generateUUID(),
        author: { role: 'user' },
        content: imageData ? {
            content_type: 'multimodal_text',
            parts: [imageData, prompt]
        } : {
            content_type: 'text',
            parts: [prompt]
        }
    };
}

/**
 * Limpiar texto de respuesta (eliminar caracteres especiales)
 */
function cleanChatGPTResponse(text) {
    // Eliminar caracteres de cita especiales
    return text.replace(/[\ue200-\ue299](cite|turn\d+|search\d+|news\d+)*/gi, "");
}

/**
 * Enviar a ChatGPT - MÉTODO EXACTO DE CHATHUB
 * Igual que class _0t.doSendMessage() en ChatHub
 */
async function sendToChatGPTDirect(prompt, model = 'auto', image = null) {
    console.log('[ChatGPT] Enviando prompt...');

    try {
        // 1. Obtener access token
        const accessToken = await getChatGPTAccessToken();

        // 2. Obtener chat requirements
        const requirements = await getChatRequirements(accessToken);

        // 3. Calcular proof-of-work si es necesario
        let proofToken = null;
        if (requirements.proofofwork && requirements.proofofwork.required) {
            console.log('[ChatGPT] Calculando proof-of-work...');
            proofToken = await generateComplexProofToken(
                requirements.proofofwork.seed,
                requirements.proofofwork.difficulty
            );
            console.log('[ChatGPT] Proof-of-work calculado');
        }

        // 4. Subir imagen si existe
        let imageData = null;
        if (image) {
            const fileId = await uploadImageToChatGPT(accessToken, image);

            // Leer dimensiones de imagen
            const imageBitmap = await createImageBitmap(image);
            imageData = {
                asset_pointer: `file-service://${fileId}`,
                width: imageBitmap.width,
                height: imageBitmap.height,
                size_bytes: image.size
            };
        }

        // 5. Construir URL
        const url = accessToken
            ? 'https://chatgpt.com/backend-api/conversation'
            : 'https://chatgpt.com/backend-anon/conversation';

        // 6. Construir body
        const body = {
            action: 'next',
            conversation_mode: { kind: 'primary_assistant' },
            force_nulligen: false,
            force_paragen: false,
            force_paragen_model_slug: '',
            force_rate_limit: false,
            force_use_sse: true,
            history_and_training_disabled: false,
            messages: [buildChatGPTMessage(prompt, imageData)],
            model: model,
            parent_message_id: chatgptConversationContext.lastMessageId || generateUUID(),
            conversation_id: chatgptConversationContext.conversationId || undefined,
            suggestions: []
        };

        console.log('[ChatGPT] URL:', url);
        console.log('[ChatGPT] Model:', model);

        // 7. Hacer petición
        const deviceId = await getDeviceId();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'text/event-stream',
                'Content-Type': 'application/json',
                'Oai-Device-Id': deviceId,
                'Oai-Language': getLanguage(),
                'Openai-Sentinel-Chat-Requirements-Token': requirements.token,
                ...(proofToken ? { 'Openai-Sentinel-Proof-Token': proofToken } : {}),
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
            },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        console.log('[ChatGPT] Response status:', response.status);

        if (response.status === 401) {
            throw new Error('There is no logged-in ChatGPT account in this browser.');
        }

        if (response.status === 403) {
            throw new Error('ChatGPT auth error (403)');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ChatGPT] Error:', errorText);
            throw new Error(`ChatGPT error: ${response.status}`);
        }

        // 8. Leer respuesta SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();

                if (line === '[DONE]') {
                    console.log('[ChatGPT] Stream finalizado');
                    break;
                }

                if (!line.startsWith('data: ')) continue;

                const jsonStr = line.substring(6);
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);

                    // Guardar conversationId y messageId
                    if (data.conversation_id) {
                        chatgptConversationContext.conversationId = data.conversation_id;
                    }

                    if (data.message?.id) {
                        chatgptConversationContext.lastMessageId = data.message.id;
                    }

                    // Extraer texto de respuesta
                    const role = data.message?.author?.role;
                    if (role === 'assistant') {
                        const content = data.message?.content;
                        if (content?.content_type === 'text' && content.parts?.[0]) {
                            fullResponse = cleanChatGPTResponse(content.parts[0]);

                            // Enviar actualización streaming
                            chrome.runtime.sendMessage({
                                type: 'STREAMING_UPDATE',
                                ai: 'chatgpt',
                                response: fullResponse,
                                isComplete: false
                            }).catch(() => {});
                        }
                    }

                } catch (e) {
                    // Ignorar errores de parsing
                }
            }

            buffer = lines[lines.length - 1];
        }

        // 9. Enviar respuesta final
        chrome.runtime.sendMessage({
            type: 'RESPONSE_RECEIVED',
            ai: 'chatgpt',
            response: fullResponse
        }).catch(() => {});

        console.log('[ChatGPT] ✓ Respuesta:', fullResponse.substring(0, 100) + '...');

        return fullResponse;

    } catch (error) {
        console.error('[ChatGPT] Error:', error);
        throw error;
    }
}

/**
 * Resetear conversación de ChatGPT
 */
function resetChatGPTConversation() {
    chatgptConversationContext = {};
    console.log('[ChatGPT] Conversación reseteada');
}

/**
 * ========================================
 * CLAUDE - Petición directa desde background
 * Clonado de ChatHub 3.99.4_0
 * ========================================
 */

// Contexto de conversación de Claude
let claudeConversationContext = null;

/**
 * Generar UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Obtener organization_uuid de Claude
 */
async function getClaudeOrganizationId() {
    console.log('[Claude] Obteniendo organization_uuid...');

    try {
        const response = await fetch('https://claude.ai/api/organizations', {
            redirect: 'error',
            cache: 'no-cache',
            credentials: 'include'
        });

        if (response.status === 403) {
            throw new Error('Please sign in to your Claude account');
        }

        const organizations = await response.json();
        const chatOrg = organizations.filter(org => org.capabilities.includes('chat'))[0];

        const orgId = chatOrg ? chatOrg.uuid : organizations[0].uuid;
        console.log('[Claude] Organization ID:', orgId);

        return orgId;

    } catch (error) {
        console.error('[Claude] Error obteniendo organization:', error);
        throw error;
    }
}

/**
 * Crear nueva conversación en Claude
 */
async function createClaudeConversation(organizationId) {
    const conversationId = generateUUID();
    console.log('[Claude] Creando conversación:', conversationId);

    try {
        await fetch(`https://claude.ai/api/organizations/${organizationId}/chat_conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: '',
                uuid: conversationId
            }),
            credentials: 'include'
        });

        return conversationId;

    } catch (error) {
        if (error.status === 403) {
            throw new Error('There is no logged-in Claude account in this browser.');
        }
        throw error;
    }
}

/**
 * Procesar chunk de streaming SSE
 */
function processClaudeStreamChunk(line) {
    if (!line.startsWith('data: ')) return null;

    const jsonStr = line.substring(6);
    if (jsonStr === '[DONE]') return null;

    try {
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

/**
 * Enviar a Claude - Petición directa desde background
 */
async function sendToClaudeDirect(prompt, image = null) {
    console.log('[Claude Direct] Enviando prompt...');

    try {
        // 1. Obtener organization_id si no existe
        if (!claudeConversationContext) {
            const organizationId = await getClaudeOrganizationId();
            const conversationId = await createClaudeConversation(organizationId);

            claudeConversationContext = {
                organizationId,
                conversationId
            };
        }

        const { organizationId, conversationId } = claudeConversationContext;

        // 2. Preparar body (files si hay imagen - por ahora sin soporte)
        const body = {
            prompt: prompt,
            files: [],
            rendering_mode: 'raw',
            attachments: []
        };

        // 3. Enviar petición principal
        const url = `https://claude.ai/api/organizations/${organizationId}/chat_conversations/${conversationId}/completion`;

        console.log('[Claude] Enviando a:', url);
        console.log('[Claude] Prompt:', prompt.substring(0, 100) + '...');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        // 4. Procesar respuesta streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                const data = processClaudeStreamChunk(line);
                if (!data) continue;

                if (data.completion) {
                    fullText += data.completion;

                    // Enviar actualización al UI
                    chrome.runtime.sendMessage({
                        type: 'STREAMING_UPDATE',
                        ai: 'claude',
                        response: fullText,
                        isComplete: false
                    }).catch(() => {});
                } else if (data.error) {
                    throw new Error(JSON.stringify(data.error));
                }
            }
        }

        console.log('[Claude] ✓ Respuesta completa recibida');

        // Notificar fin
        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: 'claude',
            response: fullText,
            isComplete: true
        }).catch(() => {});

        return fullText;

    } catch (error) {
        console.error('[Claude Direct] Error:', error);
        throw error;
    }
}

/**
 * Resetear conversación de Claude
 */
function resetClaudeConversation() {
    claudeConversationContext = null;
    console.log('[Claude] Conversación reseteada');
}

/**
 * ========================================
 * PERPLEXITY - Petición directa desde background
 * Clonado de ChatHub 3.99.4_0
 * ========================================
 */

// Contexto de conversación de Perplexity
let perplexityConversationContext = {};

/**
 * Enviar a Perplexity - Petición directa desde background
 */
async function sendToPerplexityDirect(prompt) {
    console.log('[Perplexity Direct] Enviando prompt...');

    try {
        // Preparar body
        const body = {
            params: {
                search_focus: 'internet',
                sources: ['web'],
                last_backend_uuid: perplexityConversationContext.lastBackendUuid || null,
                mode: 'copilot',
                model_preference: 'pplx_pro',
                supported_block_use_cases: [],
                version: '2.18'
            },
            query_str: prompt
        };

        console.log('[Perplexity] Enviando prompt:', prompt.substring(0, 100) + '...');

        // Enviar petición
        const response = await fetch('https://www.perplexity.ai/rest/sse/perplexity_ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Perplexity access forbidden. Please visit www.perplexity.ai and resolve any captcha.');
            }
            throw new Error(`Perplexity API error: ${response.status}`);
        }

        // Procesar respuesta streaming SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;

                const jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(jsonStr);

                    if (data.final_sse_message) {
                        // Guardar backend_uuid para siguiente mensaje
                        perplexityConversationContext.lastBackendUuid = data.backend_uuid;

                        // Parsear respuesta anidada
                        const textData = JSON.parse(data.text);
                        const finalStep = textData.find(step => step.step_type === 'FINAL');

                        if (finalStep) {
                            const answerData = JSON.parse(finalStep.content.answer);
                            fullAnswer = answerData.answer || '';

                            // Enviar actualización al UI
                            chrome.runtime.sendMessage({
                                type: 'STREAMING_UPDATE',
                                ai: 'perplexity',
                                response: fullAnswer,
                                isComplete: false
                            }).catch(() => {});
                        }
                    }
                } catch (e) {
                    // Ignorar errores de parsing
                }
            }
        }

        console.log('[Perplexity] ✓ Respuesta completa recibida');

        // Notificar fin
        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: 'perplexity',
            response: fullAnswer,
            isComplete: true
        }).catch(() => {});

        return fullAnswer;

    } catch (error) {
        console.error('[Perplexity Direct] Error:', error);
        throw error;
    }
}

/**
 * Resetear conversación de Perplexity
 */
function resetPerplexityConversation() {
    perplexityConversationContext = {};
    console.log('[Perplexity] Conversación reseteada');
}

/**
 * ========================================
 * GROQ API - Agregador de modelos open-source
 * Clonado de ChatHub 3.99.4_0
 * Modelos: Llama 3.1, Gemma 2, Mixtral, DeepSeek, etc.
 * ========================================
 */

// Contexto de conversación de Groq
let groqConversationContext = {
    messages: [],
    currentModel: 'llama-3.1-70b-versatile' // Modelo por defecto
};

/**
 * Obtener API Key de Groq desde storage
 */
async function getGroqApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['groqApiKey'], (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error('Error reading Groq API key from storage'));
                return;
            }
            if (!result.groqApiKey) {
                reject(new Error('Groq API key not configured. Please add it in settings.'));
                return;
            }
            resolve(result.groqApiKey);
        });
    });
}

/**
 * Obtener modelo actual de Groq desde storage
 */
async function getGroqModel() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['groqModel'], (result) => {
            resolve(result.groqModel || 'llama-3.1-70b-versatile');
        });
    });
}

/**
 * Enviar a Groq - Petición directa desde background
 * Compatible con API OpenAI (streaming SSE)
 */
async function sendToGroqDirect(prompt) {
    console.log('[Groq Direct] Enviando prompt...');

    try {
        // Obtener API key y modelo
        const apiKey = await getGroqApiKey();
        const model = await getGroqModel();

        // Agregar mensaje del usuario al contexto
        groqConversationContext.messages.push({
            role: 'user',
            content: prompt
        });

        // Preparar body
        const body = {
            model: model,
            messages: groqConversationContext.messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096
        };

        console.log('[Groq] Enviando a modelo:', model);
        console.log('[Groq] Prompt:', prompt.substring(0, 100) + '...');

        // Enviar petición
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Groq API key is invalid. Please check your settings.');
            } else if (response.status === 429) {
                throw new Error('Groq rate limit exceeded. Please try again later.');
            }
            throw new Error(`Groq API error: ${response.status}`);
        }

        // Procesar respuesta streaming SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;

                const jsonStr = line.substring(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(jsonStr);

                    // Formato OpenAI streaming
                    if (data.choices && data.choices[0]?.delta?.content) {
                        const deltaContent = data.choices[0].delta.content;
                        fullText += deltaContent;

                        // Enviar actualización al UI
                        chrome.runtime.sendMessage({
                            type: 'STREAMING_UPDATE',
                            ai: 'groq',
                            response: fullText,
                            isComplete: false
                        }).catch(() => {});
                    }
                } catch (e) {
                    // Ignorar errores de parsing
                }
            }
        }

        console.log('[Groq] ✓ Respuesta completa recibida');

        // Agregar respuesta al contexto
        groqConversationContext.messages.push({
            role: 'assistant',
            content: fullText
        });

        // Notificar fin
        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: 'groq',
            response: fullText,
            isComplete: true
        }).catch(() => {});

        return fullText;

    } catch (error) {
        console.error('[Groq Direct] Error:', error);
        throw error;
    }
}

/**
 * Resetear conversación de Groq
 */
function resetGroqConversation() {
    groqConversationContext.messages = [];
    console.log('[Groq] Conversación reseteada');
}

/**
 * Cambiar modelo de Groq
 */
async function setGroqModel(model) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ groqModel: model }, () => {
            groqConversationContext.currentModel = model;
            console.log('[Groq] Modelo cambiado a:', model);
            resolve();
        });
    });
}

/**
 * ========================================
 * MISTRAL API - Compatible OpenAI
 * ========================================
 */

let mistralConversationContext = { messages: [] };

async function getMistralApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['mistralApiKey'], (result) => {
            if (!result.mistralApiKey) {
                reject(new Error('Mistral API key not configured'));
                return;
            }
            resolve(result.mistralApiKey);
        });
    });
}

async function sendToMistralDirect(prompt) {
    console.log('[Mistral] Enviando prompt...');

    try {
        const apiKey = await getMistralApiKey();

        mistralConversationContext.messages.push({
            role: 'user',
            content: prompt
        });

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: mistralConversationContext.messages,
                stream: true,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.substring(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(jsonStr);
                    if (data.choices && data.choices[0]?.delta?.content) {
                        fullText += data.choices[0].delta.content;

                        chrome.runtime.sendMessage({
                            type: 'STREAMING_UPDATE',
                            ai: 'mistral',
                            response: fullText,
                            isComplete: false
                        }).catch(() => {});
                    }
                } catch (e) {}
            }
        }

        mistralConversationContext.messages.push({
            role: 'assistant',
            content: fullText
        });

        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: 'mistral',
            response: fullText,
            isComplete: true
        }).catch(() => {});

        return fullText;
    } catch (error) {
        console.error('[Mistral] Error:', error);
        throw error;
    }
}

/**
 * ========================================
 * DEEPSEEK API - Compatible OpenAI
 * ========================================
 */

let deepseekConversationContext = { messages: [] };

async function getDeepSeekApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['deepseekApiKey'], (result) => {
            if (!result.deepseekApiKey) {
                reject(new Error('DeepSeek API key not configured'));
                return;
            }
            resolve(result.deepseekApiKey);
        });
    });
}

async function sendToDeepSeekDirect(prompt) {
    console.log('[DeepSeek] Enviando prompt...');

    try {
        const apiKey = await getDeepSeekApiKey();

        deepseekConversationContext.messages.push({
            role: 'user',
            content: prompt
        });

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: deepseekConversationContext.messages,
                stream: true,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.substring(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(jsonStr);
                    if (data.choices && data.choices[0]?.delta?.content) {
                        fullText += data.choices[0].delta.content;

                        chrome.runtime.sendMessage({
                            type: 'STREAMING_UPDATE',
                            ai: 'deepseek',
                            response: fullText,
                            isComplete: false
                        }).catch(() => {});
                    }
                } catch (e) {}
            }
        }

        deepseekConversationContext.messages.push({
            role: 'assistant',
            content: fullText
        });

        chrome.runtime.sendMessage({
            type: 'STREAMING_UPDATE',
            ai: 'deepseek',
            response: fullText,
            isComplete: true
        }).catch(() => {});

        return fullText;
    } catch (error) {
        console.error('[DeepSeek] Error:', error);
        throw error;
    }
}

/**
 * ========================================
 * CÓDIGO ANTIGUO (YA NO SE USA)
 * ========================================
 */

/**
 * Función que se inyecta en MAIN WORLD (contexto de la página)
 * YA NO SE USA - Mantenido para referencia
 */
function injectMainWorldScript_OLD(aiType) {
    // Prevenir inyección múltiple
    if (window.__MULTI_CHAT_INJECTED__) {
        console.log('[Multi-Chat AI] Script ya inyectado en MAIN world');
        return;
    }
    window.__MULTI_CHAT_INJECTED__ = true;

    console.log('[Multi-Chat AI MAIN] Script inyectado en contexto de página');
    console.log('[Multi-Chat AI MAIN] Tipo de IA:', aiType);

    // Escuchar mensajes para enviar prompts
    window.addEventListener('message', async (event) => {
        // Solo procesar mensajes de nuestra extensión
        if (event.source !== window) return;
        if (event.data.type !== 'MULTI_CHAT_SEND_PROMPT') return;

        console.log('[Multi-Chat AI MAIN] Mensaje recibido:', event.data);

        const { aiType, prompt } = event.data;

        try {
            let result;

            if (aiType === 'gemini') {
                result = await sendToGeminiMainWorld(prompt);
            } else if (aiType === 'chatgpt') {
                result = await sendToChatGPTMainWorld(prompt);
            } else if (aiType === 'claude') {
                result = await sendToClaudeMainWorld(prompt);
            } else {
                throw new Error(`AI type not supported: ${aiType}`);
            }

            // Notificar éxito
            window.postMessage({
                type: 'MULTI_CHAT_RESPONSE',
                aiType: aiType,
                success: true,
                response: result
            }, '*');

        } catch (error) {
            console.error('[Multi-Chat AI MAIN] Error:', error);
            window.postMessage({
                type: 'MULTI_CHAT_ERROR',
                aiType: aiType,
                error: error.message
            }, '*');
        }
    });

    /**
     * GEMINI API - Main World
     */
    async function sendToGeminiMainWorld(prompt) {
        console.log('[Gemini MAIN] Enviando prompt...');

        // Extraer BL
        const scripts = document.getElementsByTagName('script');
        let bl = null;

        for (const script of scripts) {
            if (script.src && script.src.includes('boq_assistant-bard')) {
                const match = script.src.match(/boq_assistant-bard-web-server_[\d.]+_[\w\d]+/);
                if (match) {
                    bl = match[0];
                    break;
                }
            }
        }

        if (!bl) {
            throw new Error('No se pudo obtener el parámetro BL de Gemini');
        }

        // Generar token AT desde SAPISID
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
            throw new Error('No se encontró cookie SAPISID');
        }

        const timestamp = Date.now();
        const origin = 'https://gemini.google.com';
        const message = `${timestamp} ${sapisid} ${origin}`;

        // SHA-1 hash
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBinary = String.fromCharCode(...hashArray);
        const hashBase64 = btoa(hashBinary);
        const hashBase64url = hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        const at = `${hashBase64url}:${timestamp}`;

        // Construir URL
        const reqId = Math.floor(Math.random() * 1000000);
        const apiUrl = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${bl}&_reqid=${reqId}&rt=c`;

        // Payload
        const requestPayload = [
            [prompt, 0, null, []],
            null,
            ["", "", ""]
        ];

        const formData = new URLSearchParams();
        formData.append('f.req', JSON.stringify([null, JSON.stringify(requestPayload)]));
        formData.append('at', at);

        console.log('[Gemini MAIN] URL:', apiUrl);
        console.log('[Gemini MAIN] Payload:', requestPayload);
        console.log('[Gemini MAIN] at:', at.substring(0, 30) + '...');
        console.log('[Gemini MAIN] Enviando petición...');

        // ESTA petición fetch SÍ aparecerá en Network
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formData.toString(),
            credentials: 'include'
        });

        console.log('[Gemini MAIN] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Gemini MAIN] Error response:', errorText.substring(0, 500));
            throw new Error(`Gemini API error: ${response.status}`);
        }

        // Leer respuesta
        const text = await response.text();
        console.log('[Gemini MAIN] ✓ Respuesta recibida');

        return text;
    }

    /**
     * ChatGPT API - Main World
     */
    async function sendToChatGPTMainWorld(prompt) {
        console.log('[ChatGPT MAIN] Enviando prompt...');
        // Implementar cuando sea necesario
        throw new Error('ChatGPT Main World no implementado aún');
    }

    /**
     * Claude API - Main World
     */
    async function sendToClaudeMainWorld(prompt) {
        console.log('[Claude MAIN] Enviando prompt...');
        // Implementar cuando sea necesario
        throw new Error('Claude Main World no implementado aún');
    }

    console.log('[Multi-Chat AI MAIN] ✓ Listo para recibir mensajes');
}

/**
 * Puente de mensajes en ISOLATED WORLD
 * Escucha postMessage y lo reenvía a chrome.runtime
 */
function injectMessageBridge() {
    // Prevenir inyección múltiple
    if (window.__MULTI_CHAT_BRIDGE__) return;
    window.__MULTI_CHAT_BRIDGE__ = true;

    console.log('[Multi-Chat AI Bridge] Iniciado');

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        if (event.data.type === 'MULTI_CHAT_RESPONSE') {
            console.log('[Multi-Chat AI Bridge] Respuesta recibida:', event.data.aiType);
            chrome.runtime.sendMessage({
                type: 'RESPONSE_RECEIVED',
                ai: event.data.aiType,
                response: event.data.response
            }).catch(() => {});
        }

        if (event.data.type === 'MULTI_CHAT_ERROR') {
            console.log('[Multi-Chat AI Bridge] Error recibido:', event.data.aiType, event.data.error);
            chrome.runtime.sendMessage({
                type: 'ERROR',
                ai: event.data.aiType,
                error: event.data.error
            }).catch(() => {});
        }
    });
}

/**
 * Enviar prompt a una pestaña usando API directa
 */
async function sendPromptToTab(tab, aiType, prompt) {
    console.log(`[Multi-Chat AI] Enviando a ${aiType} (Tab ${tab.id})`);

    try {
        // MÉTODO 1: Inyectar script tag en la página (MAIN WORLD)
        // Esto hace que las peticiones fetch aparezcan en Network como si fueran de la página
        console.log(`[Multi-Chat AI] Inyectando script en MAIN WORLD para ${aiType}...`);

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',  // ← CLAVE: Ejecutar en contexto de la página, no aislado
            func: injectMainWorldScript,
            args: [aiType]
        });

        await sleep(500);

        // MÉTODO 2: Inyectar listener en isolated world
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'ISOLATED',
            func: injectMessageBridge
        });

        await sleep(500);

        // Enviar el prompt usando window.postMessage (accesible desde MAIN world)
        console.log(`[Multi-Chat AI] Enviando prompt a ${aiType} vía postMessage...`);

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: (aiType, prompt) => {
                window.postMessage({
                    type: 'MULTI_CHAT_SEND_PROMPT',
                    aiType: aiType,
                    prompt: prompt
                }, '*');
            },
            args: [aiType, prompt]
        });

        console.log(`[Multi-Chat AI] ✓ Mensaje enviado a ${aiType}`);

    } catch (error) {
        console.error(`[Multi-Chat AI] Error en ${aiType}:`, error);
        console.error(`[Multi-Chat AI] Error stack:`, error.stack);

        // Enviar notificación de error
        chrome.runtime.sendMessage({
            type: 'ERROR',
            ai: aiType,
            error: error.message || 'Error al enviar el prompt'
        }).catch(() => {});

        throw error;
    }
}

/**
 * Buscar pestañas abiertas
 */
async function findAITabs(selectedAIs) {
    const tabs = {};

    for (const aiType of selectedAIs) {
        const config = AI_CONFIGS[aiType];
        if (!config) continue;

        try {
            const matchingTabs = await chrome.tabs.query({
                url: config.urlPattern
            });

            if (matchingTabs.length > 0) {
                tabs[aiType] = matchingTabs[0];
            }
        } catch (error) {
            console.error(`[Multi-Chat AI] Error buscando ${config.name}:`, error);
        }
    }

    return tabs;
}

/**
 * Abrir pestañas faltantes
 */
async function openMissingTabs(missingAIs, existingTabs) {
    const updatedTabs = { ...existingTabs };

    for (const aiType of missingAIs) {
        const config = AI_CONFIGS[aiType];
        if (!config) continue;

        try {
            const tab = await chrome.tabs.create({
                url: config.url,
                active: false
            });

            updatedTabs[aiType] = tab;
            await sleep(500);

        } catch (error) {
            console.error(`[Multi-Chat AI] Error abriendo ${config.name}:`, error);
        }
    }

    return updatedTabs;
}

/**
 * Manejar prompts personalizados
 */
async function handleCustomPrompts(prompts, selectedAIs) {
    for (const [aiType, prompt] of Object.entries(prompts)) {
        if (!prompt || !prompt.trim()) continue;
        if (!selectedAIs.includes(aiType)) continue;

        await handleSendPrompt(prompt, [aiType]);
        await sleep(500);
    }
}

/**
 * Resumir página actual
 */
async function handleSummarizePage(tab) {
    console.log('[Multi-Chat AI] Resumiendo página:', tab.url);

    try {
        // Obtener el título y contenido de la página
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                return {
                    title: document.title,
                    url: window.location.href,
                    content: document.body.innerText.substring(0, 5000) // Primeros 5000 chars
                };
            }
        });

        const pageData = results[0].result;
        const prompt = `Resume este artículo/página web:\n\nTítulo: ${pageData.title}\nURL: ${pageData.url}\n\nContenido:\n${pageData.content}`;

        // Enviar a las IAs
        await handleSendPrompt(prompt, ['chatgpt', 'gemini', 'claude']);

        // Abrir la interfaz principal
        chrome.tabs.create({
            url: chrome.runtime.getURL('index.html')
        });

    } catch (error) {
        console.error('[Multi-Chat AI] Error resumiendo página:', error);
    }
}

/**
 * Abrir sidebar
 */
async function handleOpenSidebar(tab) {
    console.log('[Multi-Chat AI] Abriendo sidebar en tab', tab.id);

    try {
        // Inyectar el sidebar
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['sidebar.js']
        });

        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['sidebar.css']
        });

    } catch (error) {
        console.error('[Multi-Chat AI] Error abriendo sidebar:', error);
    }
}

/**
 * Toggle sidebar
 */
async function handleToggleSidebar(tab) {
    try {
        await chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_SIDEBAR'
        });
    } catch (error) {
        // Si no está inyectado, inyectarlo
        await handleOpenSidebar(tab);
    }
}

/**
 * Utilidades
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('[Multi-Chat AI] ✅ Background con Streaming cargado');
