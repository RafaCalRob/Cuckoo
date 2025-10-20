/**
 * Settings Manager - Maneja configuración avanzada
 * System prompts, plantillas, personalidad, etc.
 */

// ===========================
// Personality Presets
// ===========================
const PERSONALITY_PRESETS = {
    balanced: '',
    honest: '\n\n[INSTRUCCIÓN DEL SISTEMA: Sé brutalmente honesto, sin filtros. Dame tu opinión real incluso si puede ser controversial o directa. No te autocensures.]',
    creative: '\n\n[INSTRUCCIÓN DEL SISTEMA: Piensa de forma creativa e innovadora. No te limites a respuestas convencionales. Explora ideas originales.]',
    precise: '\n\n[INSTRUCCIÓN DEL SISTEMA: Sé extremadamente preciso y técnico. Usa datos, números y referencias específicas. Evita generalizaciones.]',
    friendly: '\n\n[INSTRUCCIÓN DEL SISTEMA: Responde de forma amigable, cercana y fácil de entender. Usa un tono conversacional y ejemplos claros.]'
};

// ===========================
// Elements
// ===========================
const settingsElements = {
    panel: document.getElementById('settings-panel'),
    btn: document.getElementById('settings-btn'),
    closeBtn: document.getElementById('close-settings'),
    saveBtn: document.getElementById('save-settings'),
    resetBtn: document.getElementById('reset-settings'),

    // AI Selectors
    aiSelectors: document.querySelectorAll('.ai-selector'),

    // Personality
    personalitySelector: document.getElementById('personality-selector'),

    // System Prompt
    systemPromptInput: document.getElementById('system-prompt-input'),
    saveSystemPromptBtn: document.getElementById('save-system-prompt'),
    clearSystemPromptBtn: document.getElementById('clear-system-prompt'),

    // Templates
    templateName: document.getElementById('template-name'),
    templateContent: document.getElementById('template-content'),
    saveTemplateBtn: document.getElementById('save-template'),
    templatesList: document.getElementById('templates-list')
};

// ===========================
// Initialization
// ===========================
function initializeSettings() {
    loadSettingsFromStorage();
    attachSettingsListeners();
    loadTemplates();
}

function attachSettingsListeners() {
    // Open/Close panel
    settingsElements.btn.addEventListener('click', openSettingsPanel);
    settingsElements.closeBtn.addEventListener('click', closeSettingsPanel);
    settingsElements.saveBtn.addEventListener('click', saveAndCloseSettings);
    settingsElements.resetBtn.addEventListener('click', resetSettings);

    // System Prompt
    settingsElements.saveSystemPromptBtn.addEventListener('click', saveSystemPrompt);
    settingsElements.clearSystemPromptBtn.addEventListener('click', clearSystemPrompt);

    // Templates
    settingsElements.saveTemplateBtn.addEventListener('click', saveTemplate);

    // AI Selectors
    settingsElements.aiSelectors.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedAIs);
    });

    // Personality
    settingsElements.personalitySelector.addEventListener('change', updatePersonality);
}

// ===========================
// Panel Management
// ===========================
function openSettingsPanel() {
    settingsElements.panel.classList.remove('hidden');
}

function closeSettingsPanel() {
    settingsElements.panel.classList.add('hidden');
}

function saveAndCloseSettings() {
    saveAllSettings();
    closeSettingsPanel();
    showNotification('Configuración guardada correctamente');
}

// ===========================
// Load/Save Settings
// ===========================
function loadSettingsFromStorage() {
    chrome.storage.local.get([
        'selectedAIs',
        'systemPrompt',
        'personalityMode'
    ], (data) => {
        // Selected AIs
        if (data.selectedAIs) {
            AppState.selectedAIs = data.selectedAIs;
            updateAICheckboxes(data.selectedAIs);
        }

        // System Prompt
        if (data.systemPrompt) {
            AppState.systemPrompt = data.systemPrompt;
            settingsElements.systemPromptInput.value = data.systemPrompt;
        }

        // Personality
        if (data.personalityMode) {
            AppState.personalityMode = data.personalityMode;
            settingsElements.personalitySelector.value = data.personalityMode;
        }
    });
}

function saveAllSettings() {
    const settings = {
        selectedAIs: AppState.selectedAIs,
        systemPrompt: AppState.systemPrompt,
        personalityMode: AppState.personalityMode
    };

    chrome.storage.local.set(settings, () => {
        console.log('Settings saved:', settings);
    });
}

function resetSettings() {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
        AppState.selectedAIs = ['chatgpt', 'gemini', 'claude'];
        AppState.systemPrompt = '';
        AppState.personalityMode = 'balanced';

        updateAICheckboxes(AppState.selectedAIs);
        settingsElements.systemPromptInput.value = '';
        settingsElements.personalitySelector.value = 'balanced';

        // Clear templates
        chrome.storage.local.remove('promptTemplates');
        loadTemplates();

        saveAllSettings();
        showNotification('Configuración restablecida');
    }
}

// ===========================
// AI Selection
// ===========================
function updateSelectedAIs() {
    const selected = [];
    settingsElements.aiSelectors.forEach(checkbox => {
        if (checkbox.checked) {
            selected.push(checkbox.value);
        }
    });

    AppState.selectedAIs = selected;
    console.log('Selected AIs:', selected);
}

function updateAICheckboxes(selectedAIs) {
    settingsElements.aiSelectors.forEach(checkbox => {
        checkbox.checked = selectedAIs.includes(checkbox.value);
    });
}

// ===========================
// System Prompt
// ===========================
function saveSystemPrompt() {
    const prompt = settingsElements.systemPromptInput.value.trim();
    AppState.systemPrompt = prompt;

    chrome.storage.local.set({ systemPrompt: prompt }, () => {
        showNotification('System Prompt guardado');
    });
}

function clearSystemPrompt() {
    settingsElements.systemPromptInput.value = '';
    AppState.systemPrompt = '';

    chrome.storage.local.set({ systemPrompt: '' }, () => {
        showNotification('System Prompt limpiado');
    });
}

// ===========================
// Personality Mode
// ===========================
function updatePersonality() {
    const mode = settingsElements.personalitySelector.value;
    AppState.personalityMode = mode;
    console.log('Personality mode:', mode);
}

// ===========================
// Prompt Templates
// ===========================
function saveTemplate() {
    const name = settingsElements.templateName.value.trim();
    const content = settingsElements.templateContent.value.trim();

    if (!name || !content) {
        alert('Por favor, introduce un nombre y contenido para la plantilla');
        return;
    }

    chrome.storage.local.get(['promptTemplates'], (data) => {
        const templates = data.promptTemplates || [];

        templates.push({
            id: Date.now(),
            name: name,
            content: content
        });

        chrome.storage.local.set({ promptTemplates: templates }, () => {
            settingsElements.templateName.value = '';
            settingsElements.templateContent.value = '';
            loadTemplates();
            showNotification(`Plantilla "${name}" guardada`);
        });
    });
}

function loadTemplates() {
    chrome.storage.local.get(['promptTemplates'], (data) => {
        const templates = data.promptTemplates || [];
        renderTemplates(templates);
    });
}

function renderTemplates(templates) {
    if (templates.length === 0) {
        settingsElements.templatesList.innerHTML = '<p class="placeholder">No hay plantillas guardadas</p>';
        return;
    }

    settingsElements.templatesList.innerHTML = templates.map(template => `
        <div class="template-item" data-id="${template.id}">
            <div class="template-info">
                <div class="template-name">${escapeHtml(template.name)}</div>
                <div class="template-preview">${escapeHtml(template.content.substring(0, 60))}...</div>
            </div>
            <div class="template-actions">
                <button class="icon-btn-small" onclick="useTemplate(${template.id})" title="Usar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                </button>
                <button class="icon-btn-small" onclick="deleteTemplate(${template.id})" title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

window.useTemplate = function(id) {
    chrome.storage.local.get(['promptTemplates'], (data) => {
        const templates = data.promptTemplates || [];
        const template = templates.find(t => t.id === id);

        if (template) {
            elements.promptInput.value = template.content;
            updateCharCount();
            closeSettingsPanel();
            showNotification(`Plantilla "${template.name}" cargada`);
        }
    });
};

window.deleteTemplate = function(id) {
    if (confirm('¿Eliminar esta plantilla?')) {
        chrome.storage.local.get(['promptTemplates'], (data) => {
            const templates = data.promptTemplates || [];
            const filtered = templates.filter(t => t.id !== id);

            chrome.storage.local.set({ promptTemplates: filtered }, () => {
                loadTemplates();
                showNotification('Plantilla eliminada');
            });
        });
    }
};

// ===========================
// Build Final Prompt
// ===========================
/**
 * Construye el prompt final con system prompt y personalidad
 */
function buildFinalPrompt(userPrompt) {
    let finalPrompt = '';

    // Add system prompt if exists
    if (AppState.systemPrompt) {
        finalPrompt += AppState.systemPrompt + '\n\n';
    }

    // Add personality preset
    const personalityText = PERSONALITY_PRESETS[AppState.personalityMode] || '';
    if (personalityText) {
        finalPrompt += personalityText + '\n\n';
    }

    // Add user prompt
    finalPrompt += userPrompt;

    return finalPrompt;
}

// Export for use in app.js
window.buildFinalPrompt = buildFinalPrompt;
window.initializeSettings = initializeSettings;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
    initializeSettings();
}
