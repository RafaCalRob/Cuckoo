/**
 * Multi-Chat AI - Main Application
 * Handles UI interactions, theme, language, and core functionality
 */

// ===========================
// State Management
// ===========================
const AppState = {
    theme: 'light', // Tema por defecto: claro
    language: 'es',
    summaryMode: false,
    autoScroll: true,
    responseTimes: {},
    currentTab: 'single',
    selectedAIs: ['chatgpt', 'gemini', 'claude'], // IAs activas
    systemPrompt: '', // System prompt global
    personalityMode: 'balanced' // balanced, honest, creative, precise
};

// ===========================
// i18n - Translations
// ===========================
const translations = {
    es: {
        waitingPrompt: 'Esperando prompt...',
        loading: 'Cargando respuesta...',
        error: 'Error',
        noTabs: 'No se encontraron pestañas abiertas de las IAs. Usa el botón "Abrir IAs".',
        sent: 'Enviado',
        words: 'palabras',
        chars: 'caracteres',
        responses: 'respuestas',
        copied: 'Copiado!',
        sendToAll: 'Enviar a Todas las IAs',
        sendCustom: 'Enviar Prompts Personalizados',
        openAIs: 'Abrir IAs',
        summaryMode: 'Modo Resumen',
        autoScrollLabel: 'Auto-scroll',
        singlePrompt: 'Prompt Único',
        customPrompts: 'Prompts Personalizados'
    },
    en: {
        waitingPrompt: 'Waiting for prompt...',
        loading: 'Loading response...',
        error: 'Error',
        noTabs: 'No AI tabs found. Use the "Open AIs" button.',
        sent: 'Sent',
        words: 'words',
        chars: 'characters',
        responses: 'responses',
        copied: 'Copied!',
        sendToAll: 'Send to All AIs',
        sendCustom: 'Send Custom Prompts',
        openAIs: 'Open AIs',
        summaryMode: 'Summary Mode',
        autoScrollLabel: 'Auto-scroll',
        singlePrompt: 'Single Prompt',
        customPrompts: 'Custom Prompts'
    }
};

// ===========================
// DOM Elements
// ===========================
const elements = {
    // Inputs
    promptInput: document.getElementById('prompt-input'),
    promptGPT: document.getElementById('prompt-gpt'),
    promptGemini: document.getElementById('prompt-gemini'),
    promptClaude: document.getElementById('prompt-claude'),

    // Buttons
    sendButton: document.getElementById('send-button'),
    sendCustomButton: document.getElementById('send-custom-button'),
    openTabsBtn: document.getElementById('open-tabs-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    clearInput: document.getElementById('clear-input'),

    // Toggles
    summaryMode: document.getElementById('summary-mode'),
    autoScroll: document.getElementById('auto-scroll'),
    languageSelector: document.getElementById('language-selector'),

    // Responses
    gptResponse: document.getElementById('gpt-response'),
    geminiResponse: document.getElementById('gemini-response'),
    claudeResponse: document.getElementById('claude-response'),

    // Status
    statusGPT: document.getElementById('status-gpt'),
    statusGemini: document.getElementById('status-gemini'),
    statusClaude: document.getElementById('status-claude'),
    responseCount: document.getElementById('response-count'),
    charCount: document.getElementById('char-count'),

    // Word counts
    gptWordCount: document.getElementById('gpt-word-count'),
    geminiWordCount: document.getElementById('gemini-word-count'),
    claudeWordCount: document.getElementById('claude-word-count'),

    // Times
    gptTime: document.getElementById('gpt-time'),
    geminiTime: document.getElementById('gemini-time'),
    claudeTime: document.getElementById('claude-time'),

    // Tutorial
    tutorialOverlay: document.getElementById('tutorial-overlay'),
    closeTutorial: document.getElementById('close-tutorial'),
    startTutorial: document.getElementById('start-tutorial'),
    btnHelp: document.getElementById('btn-help'),

    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content')
};

const responseElements = {
    chatgpt: elements.gptResponse,
    gemini: elements.geminiResponse,
    claude: elements.claudeResponse
};

const statusElements = {
    chatgpt: elements.statusGPT,
    gemini: elements.statusGemini,
    claude: elements.claudeResponse
};

// ===========================
// Initialization
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadSettings();
    attachEventListeners();
    checkFirstRun();
});

function initializeApp() {
    console.log('Multi-Chat AI initialized');
    updateResponseCount();
}

function loadSettings() {
    // Load from chrome.storage
    chrome.storage.sync.get(['theme', 'language', 'summaryMode', 'autoScroll', 'hasSeenTutorial'], (data) => {
        if (data.theme) {
            AppState.theme = data.theme;
            applyTheme(data.theme);
        }
        if (data.language) {
            AppState.language = data.language;
            elements.languageSelector.value = data.language;
            updateLanguage(data.language);
        }
        if (data.summaryMode !== undefined) {
            AppState.summaryMode = data.summaryMode;
            elements.summaryMode.checked = data.summaryMode;
        }
        if (data.autoScroll !== undefined) {
            AppState.autoScroll = data.autoScroll;
            elements.autoScroll.checked = data.autoScroll;
        }
    });
}

function checkFirstRun() {
    chrome.storage.sync.get(['hasSeenTutorial'], (data) => {
        if (!data.hasSeenTutorial) {
            showTutorial();
        }
    });
}

// ===========================
// Event Listeners
// ===========================
function attachEventListeners() {
    // Send buttons
    elements.sendButton.addEventListener('click', sendPromptToAll);
    elements.sendCustomButton.addEventListener('click', sendCustomPrompts);

    // Keyboard shortcuts
    elements.promptInput.addEventListener('keydown', handleKeydown);

    // Open tabs
    elements.openTabsBtn.addEventListener('click', openAllAITabs);

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Language selector
    elements.languageSelector.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
    });

    // Summary mode
    elements.summaryMode.addEventListener('change', (e) => {
        AppState.summaryMode = e.target.checked;
        chrome.storage.sync.set({ summaryMode: e.target.checked });
    });

    // Auto scroll
    elements.autoScroll.addEventListener('change', (e) => {
        AppState.autoScroll = e.target.checked;
        chrome.storage.sync.set({ autoScroll: e.target.checked });
    });

    // Clear input
    elements.clearInput.addEventListener('click', () => {
        elements.promptInput.value = '';
        updateCharCount();
    });

    // Input character count
    elements.promptInput.addEventListener('input', updateCharCount);

    // Tutorial
    elements.closeTutorial.addEventListener('click', hideTutorial);
    elements.startTutorial.addEventListener('click', hideTutorial);
    elements.btnHelp.addEventListener('click', showTutorial);

    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Column actions (copy, clear)
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', handleColumnAction);
    });
}

function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendPromptToAll();
    }
}

// ===========================
// Theme Management
// ===========================
function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    AppState.theme = newTheme;
    applyTheme(newTheme);
    chrome.storage.sync.set({ theme: newTheme });
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    const sunIcon = elements.themeToggle.querySelector('.sun-icon');
    const moonIcon = elements.themeToggle.querySelector('.moon-icon');

    if (theme === 'light') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// ===========================
// Language Management
// ===========================
function updateLanguage(lang) {
    AppState.language = lang;
    chrome.storage.sync.set({ language: lang });

    const t = translations[lang];

    // Update all translatable elements
    elements.sendButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        ${t.sendToAll}
    `;

    elements.sendCustomButton.textContent = t.sendCustom;
    elements.openTabsBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
        ${t.openAIs}
    `;

    document.querySelector('.toggle-label').textContent = t.summaryMode;
    document.querySelectorAll('.tab-btn')[0].textContent = t.singlePrompt;
    document.querySelectorAll('.tab-btn')[1].textContent = t.customPrompts;

    updateCharCount();
    updateResponseCount();
}

// ===========================
// Tab Management
// ===========================
function switchTab(tabName) {
    AppState.currentTab = tabName;

    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    elements.tabContents.forEach(content => {
        if (content.id === `tab-${tabName}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// ===========================
// Open AI Tabs
// ===========================
function openAllAITabs() {
    console.log('Abriendo pestañas de IAs...');

    // Obtener las IAs seleccionadas (o usar las 3 principales por defecto)
    const selectedAIs = AppState.selectedAIs && AppState.selectedAIs.length > 0
        ? AppState.selectedAIs
        : ['chatgpt', 'gemini', 'claude'];

    const urlMap = {
        chatgpt: 'https://chatgpt.com',
        gemini: 'https://gemini.google.com/app',
        claude: 'https://claude.ai/new',
        meta: 'https://www.meta.ai',
        grok: 'https://x.com/i/grok',
        perplexity: 'https://www.perplexity.ai'
    };

    let openedCount = 0;

    selectedAIs.forEach((aiType, index) => {
        const url = urlMap[aiType];
        if (url) {
            setTimeout(() => {
                chrome.tabs.create({ url, active: false }, (tab) => {
                    console.log(`Pestaña ${aiType} abierta:`, tab.id, url);
                    openedCount++;
                });
            }, index * 500); // Espaciar las aperturas por 500ms
        }
    });

    // Update status after opening
    setTimeout(() => {
        console.log(`Total de pestañas abiertas: ${openedCount}`);
        checkAITabs();
    }, (selectedAIs.length * 500) + 2000);
}

function checkAITabs() {
    const aiTypes = ['chatgpt', 'gemini', 'claude'];
    const configs = {
        chatgpt: '*://chatgpt.com/*',
        gemini: '*://gemini.google.com/*',
        claude: '*://claude.ai/*'
    };

    aiTypes.forEach(async (ai) => {
        const tabs = await chrome.tabs.query({ url: configs[ai] });
        updateConnectionStatus(ai, tabs.length > 0 ? 'connected' : 'disconnected');
    });
}

function updateConnectionStatus(ai, status) {
    const statusElement = document.getElementById(`status-${ai === 'chatgpt' ? 'gpt' : ai}`);
    if (statusElement) {
        statusElement.classList.remove('connected', 'loading', 'error');
        if (status === 'connected') {
            statusElement.classList.add('connected');
        } else if (status === 'loading') {
            statusElement.classList.add('loading');
        } else if (status === 'error') {
            statusElement.classList.add('error');
        }
    }
}

// ===========================
// Send Prompts
// ===========================
async function sendPromptToAll() {
    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        alert(translations[AppState.language].waitingPrompt);
        return;
    }

    disableSendButton();
    resetResponseTimes();

    // Check if sequential mode is enabled
    if (window.SequentialState && window.SequentialState.enabled) {
        // Execute sequential mode (one generates, others validate)
        if (typeof window.executeSequentialMode === 'function') {
            await window.executeSequentialMode(prompt);
        }
    } else {
        // Normal mode: all AIs respond to the same prompt
        // Build final prompt with system prompt and personality
        const finalPrompt = window.buildFinalPrompt ? window.buildFinalPrompt(prompt) : prompt;

        clearAllResponses();

        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'SEND_PROMPT',
            prompt: finalPrompt,
            summaryMode: AppState.summaryMode,
            selectedAIs: AppState.selectedAIs
        });
    }
}

async function sendCustomPrompts() {
    const rawPrompts = {
        chatgpt: elements.promptGPT.value.trim(),
        gemini: elements.promptGemini.value.trim(),
        claude: elements.promptClaude.value.trim()
    };

    if (!rawPrompts.chatgpt && !rawPrompts.gemini && !rawPrompts.claude) {
        alert('Escribe al menos un prompt personalizado');
        return;
    }

    // Apply system prompt and personality to each custom prompt
    const prompts = {};
    for (const [ai, prompt] of Object.entries(rawPrompts)) {
        if (prompt) {
            prompts[ai] = window.buildFinalPrompt ? window.buildFinalPrompt(prompt) : prompt;
        }
    }

    disableSendButton();
    clearAllResponses();

    chrome.runtime.sendMessage({
        type: 'SEND_CUSTOM_PROMPTS',
        prompts: prompts,
        summaryMode: AppState.summaryMode,
        selectedAIs: AppState.selectedAIs
    });
}

// ===========================
// Response Handling
// ===========================
function displayResponse(ai, response) {
    // Use the winner system's markdown rendering if available
    if (typeof window.displayResponseWithMarkdown === 'function') {
        window.displayResponseWithMarkdown(ai, response);
        return;
    }

    // Fallback to basic rendering
    const element = responseElements[ai];
    if (!element) return;

    element.classList.remove('loading');

    if (AppState.summaryMode) {
        element.innerHTML = `<div class="response-text">${escapeHtml(summarizeText(response))}</div>`;
    } else {
        element.innerHTML = `<div class="response-text">${escapeHtml(response)}</div>`;
    }

    updateWordCount(ai, response);
    updateResponseTime(ai);
    updateResponseCount();

    if (AppState.autoScroll) {
        element.scrollTop = element.scrollHeight;
    }
}

function displayError(ai, error) {
    const element = responseElements[ai];
    if (!element) return;

    element.classList.remove('loading');
    element.innerHTML = `<div class="error-message">${translations[AppState.language].error}: ${escapeHtml(error)}</div>`;

    updateConnectionStatus(ai, 'error');
}

function clearAllResponses() {
    const t = translations[AppState.language];

    Object.values(responseElements).forEach(element => {
        element.innerHTML = `<div class="loading-indicator"></div><p>${t.loading}</p>`;
        element.classList.add('loading');
    });

    updateResponseCount();

    ['chatgpt', 'gemini', 'claude'].forEach(ai => {
        updateConnectionStatus(ai, 'loading');
    });
}

// ===========================
// Utility Functions
// ===========================
function summarizeText(text) {
    // Simple summarization: take first 3 sentences or 200 chars
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length <= 3) return text;

    return sentences.slice(0, 3).join(' ') + '...';
}

function updateWordCount(ai, text) {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const t = translations[AppState.language];

    const countElement = document.getElementById(`${ai === 'chatgpt' ? 'gpt' : ai}-word-count`);
    if (countElement) {
        countElement.textContent = `${wordCount} ${t.words}`;
    }
}

function updateResponseTime(ai) {
    if (!AppState.responseTimes[ai]) return;

    const elapsed = Date.now() - AppState.responseTimes[ai];
    const seconds = (elapsed / 1000).toFixed(1);

    const timeElement = document.getElementById(`${ai === 'chatgpt' ? 'gpt' : ai}-time`);
    if (timeElement) {
        timeElement.textContent = `${seconds}s`;
    }
}

function resetResponseTimes() {
    const now = Date.now();
    AppState.responseTimes = {
        chatgpt: now,
        gemini: now,
        claude: now
    };
}

function updateCharCount() {
    const count = elements.promptInput.value.length;
    const t = translations[AppState.language];
    elements.charCount.textContent = `${count} ${t.chars}`;
}

function updateResponseCount() {
    const responses = document.querySelectorAll('.response-content:not(.loading)').length;
    const t = translations[AppState.language];
    elements.responseCount.textContent = `${responses}/3 ${t.responses}`;
}

function disableSendButton() {
    elements.sendButton.disabled = true;
    elements.sendButton.textContent = translations[AppState.language].sent;
}

function enableSendButton() {
    elements.sendButton.disabled = false;
    const t = translations[AppState.language];
    elements.sendButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        ${t.sendToAll}
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// Column Actions
// ===========================
function handleColumnAction(e) {
    const action = e.currentTarget.dataset.action;
    const ai = e.currentTarget.dataset.ai;

    if (action === 'copy') {
        copyResponse(ai);
    } else if (action === 'clear') {
        clearResponse(ai);
    }
}

function copyResponse(ai) {
    const element = responseElements[ai];
    if (!element) return;

    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        showNotification(translations[AppState.language].copied);
    });
}

function clearResponse(ai) {
    const element = responseElements[ai];
    if (!element) return;

    element.innerHTML = `<p class="placeholder">${translations[AppState.language].waitingPrompt}</p>`;
    updateConnectionStatus(ai, 'disconnected');
}

function showNotification(message) {
    // Simple notification (you can enhance this)
    console.log('Notification:', message);
}

// ===========================
// Tutorial
// ===========================
function showTutorial() {
    elements.tutorialOverlay.classList.remove('hidden');
}

function hideTutorial() {
    elements.tutorialOverlay.classList.add('hidden');
    chrome.storage.sync.set({ hasSeenTutorial: true });
}

// ===========================
// Listen to Background Messages
// ===========================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message.type);

    // NUEVO: Streaming en tiempo real
    if (message.type === 'STREAMING_UPDATE') {
        displayStreamingUpdate(message.ai, message.response, message.isComplete);
        updateConnectionStatus(message.ai, 'loading');
    }
    // Respuesta completa (legacy + final)
    else if (message.type === 'RESPONSE_RECEIVED') {
        displayResponse(message.ai, message.response);
        updateConnectionStatus(message.ai, 'connected');
    }
    else if (message.type === 'ERROR') {
        displayError(message.ai, message.error);
    }
    else if (message.type === 'ALL_SENT') {
        enableSendButton();
    }
    else if (message.type === 'NO_TABS') {
        showError(translations[AppState.language].noTabs);
        enableSendButton();
    }

    sendResponse({ received: true });
    return true;
});

/**
 * NUEVO: Mostrar actualizaciones de streaming en tiempo real
 */
function displayStreamingUpdate(ai, response, isComplete) {
    // Usar el sistema de markdown si está disponible
    if (typeof window.displayResponseWithMarkdown === 'function') {
        window.displayResponseWithMarkdown(ai, response);
    } else {
        // Fallback: renderizado básico
        const element = responseElements[ai];
        if (!element) return;

        element.classList.remove('loading');
        element.classList.add('streaming'); // Clase para indicar que está en streaming

        if (AppState.summaryMode && isComplete) {
            element.innerHTML = `<div class="response-text">${escapeHtml(summarizeText(response))}</div>`;
        } else {
            // Renderizar el texto mientras se escribe
            element.innerHTML = `<div class="response-text streaming-text">${escapeHtml(response)}</div>`;
        }

        // Actualizar métricas en tiempo real
        updateWordCount(ai, response);

        // Auto-scroll si está habilitado
        if (AppState.autoScroll) {
            element.scrollTop = element.scrollHeight;
        }
    }

    // Si está completo, actualizar el tiempo y quitar el indicador de streaming
    if (isComplete) {
        const element = responseElements[ai];
        if (element) {
            element.classList.remove('streaming');
        }
        updateResponseTime(ai);
        updateResponseCount();
        updateConnectionStatus(ai, 'connected');
    }
}

function showError(message) {
    Object.values(responseElements).forEach(element => {
        element.classList.remove('loading');
        element.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
    });
}

// Check tabs on load
checkAITabs();

// ===========================
// Export Functions for Sequential Mode
// ===========================
window.clearAllResponses = clearAllResponses;
window.displayResponse = displayResponse;
window.updateCharCount = updateCharCount;
