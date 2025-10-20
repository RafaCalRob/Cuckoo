/**
 * Background Script V2 - Sistema Simplificado con Clipboard
 * Estrategia: Copiar al portapapeles y mostrar notificación en las pestañas
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
 * Abrir la página principal cuando se hace click en el icono
 */
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
    });
});

/**
 * Listener ÚNICO para todos los mensajes
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background V2 recibió:', message.type);

    if (message.type === 'SEND_PROMPT') {
        handleSendPromptV2(message.prompt, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    else if (message.type === 'SEND_CUSTOM_PROMPTS') {
        handleCustomPromptsV2(message.prompts, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    else if (message.type === 'RESPONSE_EXTRACTED') {
        // Reenviar respuesta a la UI
        chrome.runtime.sendMessage({
            type: 'RESPONSE_RECEIVED',
            ai: message.aiType,
            response: message.response
        }).catch(err => console.log('No hay receptores:', err));
        sendResponse({ received: true });
    }

    return true;
});

/**
 * NUEVO: Manejar envío de prompt con sistema de clipboard
 */
async function handleSendPromptV2(prompt, selectedAIs) {
    console.log('=== SISTEMA V2: Clipboard + Notificación ===');
    console.log('Prompt:', prompt);
    console.log('IAs seleccionadas:', selectedAIs);

    try {
        // Paso 1: Buscar pestañas existentes
        let aiTabs = await findAITabs(selectedAIs);
        console.log('Pestañas encontradas:', Object.keys(aiTabs).length);

        // Paso 2: Abrir pestañas que falten
        const missingAIs = selectedAIs.filter(ai => !aiTabs[ai]);
        if (missingAIs.length > 0) {
            console.log('Abriendo pestañas faltantes:', missingAIs);
            aiTabs = await openMissingTabs(missingAIs, aiTabs);
            // Esperar a que carguen
            await sleep(2000);
        }

        // Paso 3: Notificar al usuario que copiaremos al portapapeles
        chrome.runtime.sendMessage({
            type: 'CLIPBOARD_READY',
            prompt: prompt,
            count: Object.keys(aiTabs).length
        });

        // Paso 4: Inyectar content script y mostrar notificación en cada pestaña
        for (const [aiType, tab] of Object.entries(aiTabs)) {
            try {
                console.log(`Mostrando notificación en ${aiType} (Tab ${tab.id})`);

                // Inyectar content script V2
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content_script_v2.js']
                });

                await sleep(300);

                // Enviar mensaje para mostrar notificación
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'SHOW_PASTE_NOTIFICATION',
                    aiType: aiType,
                    prompt: prompt
                });

                console.log(`✅ Notificación enviada a ${aiType}`);

            } catch (error) {
                console.error(`Error en ${aiType}:`, error);
                chrome.runtime.sendMessage({
                    type: 'ERROR',
                    ai: aiType,
                    error: `No se pudo mostrar la notificación: ${error.message}`
                });
            }
        }

        // Paso 5: Notificar que todo está listo
        chrome.runtime.sendMessage({
            type: 'ALL_NOTIFICATIONS_SENT',
            count: Object.keys(aiTabs).length
        });

    } catch (error) {
        console.error('Error en handleSendPromptV2:', error);
        chrome.runtime.sendMessage({
            type: 'ERROR',
            ai: 'general',
            error: error.message
        });
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
                console.log(`✓ ${config.name} ya está abierto (Tab ${matchingTabs[0].id})`);
            }
        } catch (error) {
            console.error(`Error buscando ${config.name}:`, error);
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
            console.log(`Abriendo ${config.name}...`);
            const tab = await chrome.tabs.create({
                url: config.url,
                active: false
            });

            updatedTabs[aiType] = tab;
            console.log(`✓ ${config.name} abierto (Tab ${tab.id})`);

            // Pequeña pausa entre aperturas
            await sleep(500);

        } catch (error) {
            console.error(`Error abriendo ${config.name}:`, error);
        }
    }

    return updatedTabs;
}

/**
 * Manejar prompts personalizados
 */
async function handleCustomPromptsV2(prompts, selectedAIs) {
    console.log('Procesando prompts personalizados (V2)');

    for (const [aiType, prompt] of Object.entries(prompts)) {
        if (!prompt || !prompt.trim()) continue;

        await handleSendPromptV2(prompt, [aiType]);
        await sleep(500);
    }
}

/**
 * Utilidades
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('✅ Background Script V2 cargado (Sistema de Clipboard)');
