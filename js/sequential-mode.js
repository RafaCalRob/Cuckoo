/**
 * Sequential/Chain Mode
 * One AI generates, others validate/correct
 */

// State
const SequentialState = {
    enabled: false,
    generator: 'chatgpt', // Which AI generates the initial response
    validators: ['gemini', 'claude'], // Which AIs validate
    originalResponse: '',
    validations: {}
};

// Elements
const sequentialElements = {
    toggle: document.getElementById('sequential-mode'),
    config: document.getElementById('sequential-config'),
    generatorSelector: document.getElementById('generator-selector')
};

// ===========================
// Initialize
// ===========================
function initSequentialMode() {
    // Load saved settings
    chrome.storage.local.get(['sequentialMode', 'sequentialGenerator'], (data) => {
        if (data.sequentialMode) {
            SequentialState.enabled = data.sequentialMode;
            sequentialElements.toggle.checked = true;
            sequentialElements.config.classList.remove('hidden');
        }

        if (data.sequentialGenerator) {
            SequentialState.generator = data.sequentialGenerator;
            sequentialElements.generatorSelector.value = data.sequentialGenerator;
        }

        updateValidators();
    });

    // Event listeners
    sequentialElements.toggle.addEventListener('change', handleToggleChange);
    sequentialElements.generatorSelector.addEventListener('change', handleGeneratorChange);
}

// ===========================
// Toggle Handler
// ===========================
function handleToggleChange(e) {
    SequentialState.enabled = e.target.checked;

    if (SequentialState.enabled) {
        sequentialElements.config.classList.remove('hidden');
    } else {
        sequentialElements.config.classList.add('hidden');
    }

    chrome.storage.local.set({ sequentialMode: SequentialState.enabled });

    showModeChangeNotification(SequentialState.enabled ? 'activado' : 'desactivado');
}

// ===========================
// Generator Change Handler
// ===========================
function handleGeneratorChange(e) {
    SequentialState.generator = e.target.value;
    updateValidators();
    chrome.storage.local.set({ sequentialGenerator: SequentialState.generator });

    console.log('Generator:', SequentialState.generator);
    console.log('Validators:', SequentialState.validators);
}

function updateValidators() {
    const allAIs = ['chatgpt', 'gemini', 'claude'];
    SequentialState.validators = allAIs.filter(ai => ai !== SequentialState.generator);
}

// ===========================
// Execute Sequential Mode
// ===========================
async function executeSequentialMode(prompt) {
    console.log('Executing sequential mode...');
    console.log('Generator:', SequentialState.generator);
    console.log('Validators:', SequentialState.validators);

    // Build final prompt with system prompt and personality
    const finalPrompt = window.buildFinalPrompt ? window.buildFinalPrompt(prompt) : prompt;

    // Step 1: Send to generator only
    await sendToGenerator(finalPrompt);

    // Wait for response (we'll listen for it in app.js)
    // When we get the response, we'll call validateResponse()
}

async function sendToGenerator(prompt) {
    console.log('Sending to generator:', SequentialState.generator);

    // Clear all first
    if (typeof window.clearAllResponses === 'function') {
        window.clearAllResponses();
    }

    // Clear role markers from previous run
    clearRoleMarkers();

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mark generator column
    markAsGenerator(SequentialState.generator);

    // Mark validators
    SequentialState.validators.forEach(ai => markAsValidator(ai));

    // Send only to generator
    chrome.runtime.sendMessage({
        type: 'SEND_PROMPT',
        prompt: prompt,
        selectedAIs: [SequentialState.generator]
    });
}

// ===========================
// Validate Response
// ===========================
async function validateResponse(generatorAI, response) {
    console.log('Validating response from:', generatorAI);

    // Store original response
    SequentialState.originalResponse = response;

    // Build validation prompt
    const validationPrompt = buildValidationPrompt(response);

    // Send to validators
    setTimeout(() => {
        chrome.runtime.sendMessage({
            type: 'SEND_PROMPT',
            prompt: validationPrompt,
            selectedAIs: SequentialState.validators
        });
    }, 1000); // Small delay to show the generation first
}

function buildValidationPrompt(originalResponse) {
    return `Analiza la siguiente respuesta y proporciona tu validación/corrección:

RESPUESTA ORIGINAL:
"""
${originalResponse}
"""

Por favor, proporciona:
1. ✅ Aspectos correctos (qué está bien)
2. ⚠️ Aspectos a mejorar (qué se puede mejorar)
3. 🔧 Correcciones específicas (cambios concretos)
4. ⭐ Valoración general (del 1 al 10)

Sé constructivo y específico.`;
}

// ===========================
// Visual Markers
// ===========================
function markAsGenerator(ai) {
    const column = document.querySelector(`.chat-column[data-ai="${ai}"]`);
    if (!column) return;

    // Add generator badge
    let badge = column.querySelector('.role-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'role-badge role-badge-generator';
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            GENERADOR
        `;
        column.insertBefore(badge, column.firstChild);
    }

    column.classList.add('is-generator');
}

function markAsValidator(ai) {
    const column = document.querySelector(`.chat-column[data-ai="${ai}"]`);
    if (!column) return;

    // Add validator badge
    let badge = column.querySelector('.role-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'role-badge role-badge-validator';
        badge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            VALIDADOR
        `;
        column.insertBefore(badge, column.firstChild);
    }

    column.classList.add('is-validator');
}

function clearRoleMarkers() {
    document.querySelectorAll('.role-badge').forEach(badge => badge.remove());
    document.querySelectorAll('.chat-column').forEach(column => {
        column.classList.remove('is-generator', 'is-validator');
    });
}

// ===========================
// Notifications
// ===========================
function showModeChangeNotification(status) {
    const notification = document.createElement('div');
    notification.className = 'winner-notification';
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>Modo Secuencial ${status}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// ===========================
// Listen for Generator Response
// ===========================
// We need to hook into the response handling to trigger validation
let originalDisplayResponseWithMarkdown = null;

function hookResponseHandler() {
    // Store original function
    if (window.displayResponseWithMarkdown && !originalDisplayResponseWithMarkdown) {
        originalDisplayResponseWithMarkdown = window.displayResponseWithMarkdown;

        // Override displayResponseWithMarkdown
        window.displayResponseWithMarkdown = function(ai, response) {
            // Call original
            originalDisplayResponseWithMarkdown.call(this, ai, response);

            // If sequential mode is on and this is the generator
            if (SequentialState.enabled && ai === SequentialState.generator) {
                console.log('Generator response received, triggering validation...');
                // Trigger validation after a small delay
                setTimeout(() => {
                    validateResponse(ai, response);
                }, 2000);
            }
        };
    }

    // Also hook the basic displayResponse if it exists
    if (window.displayResponse && window.displayResponse !== window.displayResponseWithMarkdown) {
        const originalDisplayResponse = window.displayResponse;
        window.displayResponse = function(ai, response) {
            originalDisplayResponse.call(this, ai, response);

            if (SequentialState.enabled && ai === SequentialState.generator) {
                console.log('Generator response received (basic), triggering validation...');
                setTimeout(() => {
                    validateResponse(ai, response);
                }, 2000);
            }
        };
    }
}

// ===========================
// Exports
// ===========================
window.SequentialState = SequentialState;
window.executeSequentialMode = executeSequentialMode;
window.clearRoleMarkers = clearRoleMarkers;

// ===========================
// Initialize on Load
// ===========================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSequentialMode();
        hookResponseHandler();
    });
} else {
    initSequentialMode();
    hookResponseHandler();
}

console.log('Sequential mode loaded');
