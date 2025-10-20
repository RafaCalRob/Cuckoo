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
 * Manejar envío de prompt con streaming
 */
async function handleSendPrompt(prompt, selectedAIs) {
    console.log('[Multi-Chat AI] Enviando prompt a', selectedAIs.length, 'IAs');

    try {
        // Buscar pestañas abiertas
        let aiTabs = await findAITabs(selectedAIs);

        // Abrir pestañas faltantes
        const missingAIs = selectedAIs.filter(ai => !aiTabs[ai]);
        if (missingAIs.length > 0) {
            console.log('[Multi-Chat AI] Abriendo pestañas:', missingAIs);
            aiTabs = await openMissingTabs(missingAIs, aiTabs);
            await sleep(2000);
        }

        if (Object.keys(aiTabs).length === 0) {
            console.warn('[Multi-Chat AI] No se encontraron pestañas');
            chrome.runtime.sendMessage({ type: 'NO_TABS' });
            return;
        }

        // Enviar a cada pestaña con el content script de streaming
        for (const [aiType, tab] of Object.entries(aiTabs)) {
            try {
                await sendPromptToTab(tab, aiType, prompt);
            } catch (error) {
                console.error(`[Multi-Chat AI] Error en ${aiType}:`, error);
                chrome.runtime.sendMessage({
                    type: 'ERROR',
                    ai: aiType,
                    error: error.message
                });
            }
        }

        chrome.runtime.sendMessage({ type: 'ALL_SENT' });

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
 * Enviar prompt a una pestaña con streaming
 */
async function sendPromptToTab(tab, aiType, prompt) {
    console.log(`[Multi-Chat AI] Enviando a ${aiType} (Tab ${tab.id})`);

    try {
        // Inyectar el content script de streaming
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_script_streaming.js']
        });

        await sleep(500);

        // Enviar el prompt
        await chrome.tabs.sendMessage(tab.id, {
            type: 'INJECT_PROMPT',
            prompt: prompt,
            aiType: aiType
        });

        console.log(`[Multi-Chat AI] ✓ Enviado a ${aiType}`);

    } catch (error) {
        console.error(`[Multi-Chat AI] Error en ${aiType}:`, error);
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
