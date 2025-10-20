/**
 * Background Script - Coordinador central
 * Maneja la comunicación entre el popup y los content scripts
 */

// Configuración de las IAs y sus URLs
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
 * Listener ÚNICO para todos los mensajes (evitar duplicados)
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background recibió mensaje:', message.type, message);

    // Mensajes desde la UI
    if (message.type === 'SEND_PROMPT') {
        handleSendPrompt(message.prompt, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    else if (message.type === 'SEND_CUSTOM_PROMPTS') {
        handleCustomPrompts(message.prompts, message.selectedAIs || ['chatgpt', 'gemini', 'claude']);
        sendResponse({ status: 'processing' });
    }
    // Mensajes desde los content scripts
    else if (message.type === 'RESPONSE_EXTRACTED') {
        console.log('Respuesta extraída de', message.aiType);
        // Reenviar la respuesta a todas las ventanas/tabs de la extensión
        chrome.runtime.sendMessage({
            type: 'RESPONSE_RECEIVED',
            ai: message.aiType,
            response: message.response
        }).catch(err => console.log('No hay receptores para RESPONSE_RECEIVED:', err));
        sendResponse({ received: true });
    }
    else if (message.type === 'EXTRACTION_ERROR') {
        console.log('Error de extracción en', message.aiType);
        // Reenviar el error a todas las ventanas/tabs de la extensión
        chrome.runtime.sendMessage({
            type: 'ERROR',
            ai: message.aiType,
            error: message.error
        }).catch(err => console.log('No hay receptores para ERROR:', err));
        sendResponse({ received: true });
    }

    return true; // Mantener el canal abierto para respuestas asíncronas
});

/**
 * Manejar el envío del prompt a las IAs seleccionadas
 */
async function handleSendPrompt(prompt, selectedAIs) {
    console.log('Procesando prompt:', prompt);
    console.log('IAs seleccionadas:', selectedAIs);

    // Buscar pestañas abiertas solo de las IAs seleccionadas
    const aiTabs = await findAITabs(selectedAIs);

    console.log('Pestañas encontradas:', aiTabs);

    // Si no se encontraron pestañas, notificar al popup
    if (Object.keys(aiTabs).length === 0) {
        console.warn('⚠️ NO SE ENCONTRARON PESTAÑAS ABIERTAS');
        chrome.runtime.sendMessage({
            type: 'NO_TABS'
        }).catch(err => console.log('Error enviando NO_TABS:', err));
        return;
    }

    console.log('✓ Pestañas encontradas, enviando prompts...');

    // Enviar el prompt a cada pestaña encontrada
    for (const [aiType, tab] of Object.entries(aiTabs)) {
        try {
            await sendPromptToTab(tab, aiType, prompt);
        } catch (error) {
            console.error(`Error enviando a ${aiType}:`, error);
            chrome.runtime.sendMessage({
                type: 'ERROR',
                ai: aiType,
                error: error.message
            });
        }
    }

    // Notificar que todos los prompts fueron enviados
    chrome.runtime.sendMessage({
        type: 'ALL_SENT'
    });
}

/**
 * Buscar pestañas abiertas de las IAs seleccionadas
 */
async function findAITabs(selectedAIs = null) {
    const tabs = {};
    const aisToFind = selectedAIs || Object.keys(AI_CONFIGS);

    console.log('Buscando pestañas para:', aisToFind);

    for (const aiType of aisToFind) {
        const config = AI_CONFIGS[aiType];
        if (!config) {
            console.warn(`Configuración no encontrada para: ${aiType}`);
            continue;
        }

        try {
            console.log(`Buscando ${config.name} con patrón:`, config.urlPattern);

            const matchingTabs = await chrome.tabs.query({
                url: config.urlPattern
            });

            console.log(`Pestañas encontradas para ${config.name}:`, matchingTabs.length);

            if (matchingTabs.length > 0) {
                // Usar la primera pestaña encontrada
                tabs[aiType] = matchingTabs[0];
                console.log(`✓ Pestaña ${config.name} encontrada:`, matchingTabs[0].id, matchingTabs[0].url);
            } else {
                console.log(`✗ No se encontró pestaña para ${config.name}`);
            }
        } catch (error) {
            console.error(`Error buscando pestañas de ${config.name}:`, error);
        }
    }

    console.log('Total de pestañas encontradas:', Object.keys(tabs).length);
    return tabs;
}

/**
 * Enviar prompt a una pestaña específica
 */
async function sendPromptToTab(tab, aiType, prompt) {
    console.log(`Enviando prompt a ${aiType} (tab ${tab.id})`);

    try {
        // Inyectar el content script en la pestaña
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content_script.js']
        });

        // Esperar un momento para que el script se cargue
        await sleep(500);

        // Enviar el prompt al content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'INJECT_PROMPT',
            prompt: prompt,
            aiType: aiType
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(`Error al comunicarse con ${aiType}:`, chrome.runtime.lastError);
                chrome.runtime.sendMessage({
                    type: 'ERROR',
                    ai: aiType,
                    error: 'No se pudo comunicar con la página'
                });
            } else {
                console.log(`Respuesta de ${aiType}:`, response);
            }
        });

    } catch (error) {
        console.error(`Error inyectando script en ${aiType}:`, error);
        throw new Error(`No se pudo inyectar el script: ${error.message}`);
    }
}

// NOTA: Listener consolidado arriba - no agregar más listeners aquí

/**
 * Manejar prompts personalizados
 */
async function handleCustomPrompts(prompts, selectedAIs) {
    console.log('Procesando prompts personalizados:', prompts);

    const aiTabs = await findAITabs(selectedAIs);

    if (Object.keys(aiTabs).length === 0) {
        chrome.runtime.sendMessage({ type: 'NO_TABS' });
        return;
    }

    // Enviar cada prompt personalizado
    for (const [aiType, tab] of Object.entries(aiTabs)) {
        if (prompts[aiType] && prompts[aiType].trim()) {
            try {
                await sendPromptToTab(tab, aiType, prompts[aiType]);
            } catch (error) {
                console.error(`Error enviando a ${aiType}:`, error);
                chrome.runtime.sendMessage({
                    type: 'ERROR',
                    ai: aiType,
                    error: error.message
                });
            }
        }
    }

    chrome.runtime.sendMessage({ type: 'ALL_SENT' });
}

/**
 * Función auxiliar para esperar
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Función de debugging - listar todas las pestañas
 */
async function debugListAllTabs() {
    const allTabs = await chrome.tabs.query({});
    console.log('===== TODAS LAS PESTAÑAS ABIERTAS =====');
    allTabs.forEach(tab => {
        console.log(`Tab ${tab.id}: ${tab.url}`);
    });
    console.log('======================================');
}

/**
 * Log inicial
 */
console.log('Background script de Multi-Chat AI cargado correctamente');

// Debug inicial - listar todas las pestañas cada 5 segundos durante el desarrollo
setInterval(() => {
    debugListAllTabs();
}, 5000);
