// Elementos del DOM
const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const gptResponse = document.getElementById('gpt-response');
const geminiResponse = document.getElementById('gemini-response');
const claudeResponse = document.getElementById('claude-response');

// Mapa de IDs de respuesta
const responseElements = {
    'chatgpt': gptResponse,
    'gemini': geminiResponse,
    'claude': claudeResponse
};

// Event listener para el botón de envío
sendButton.addEventListener('click', sendPromptToAll);

// Permitir enviar con Ctrl/Cmd + Enter
promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        sendPromptToAll();
    }
});

/**
 * Función principal para enviar el prompt a todas las IAs
 */
function sendPromptToAll() {
    const prompt = promptInput.value.trim();

    // Validar que el prompt no esté vacío
    if (!prompt) {
        alert('Por favor, escribe un prompt antes de enviar.');
        return;
    }

    // Deshabilitar el botón mientras se procesa
    sendButton.disabled = true;
    sendButton.textContent = 'Enviando...';

    // Limpiar respuestas anteriores y mostrar indicador de carga
    Object.values(responseElements).forEach(element => {
        element.innerHTML = '<div class="loading-indicator"></div><p>Cargando respuesta...</p>';
        element.classList.add('loading');
    });

    // Enviar mensaje al background script
    chrome.runtime.sendMessage({
        type: 'SEND_PROMPT',
        prompt: prompt
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error al enviar mensaje:', chrome.runtime.lastError);
            showError('Error de comunicación con el background script');
            resetButton();
        } else {
            console.log('Mensaje enviado correctamente al background script');
        }
    });
}

/**
 * Escuchar respuestas del background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensaje recibido en popup:', message);

    if (message.type === 'RESPONSE_RECEIVED') {
        displayResponse(message.ai, message.response);
    } else if (message.type === 'ERROR') {
        displayError(message.ai, message.error);
    } else if (message.type === 'ALL_SENT') {
        // Todos los prompts fueron enviados
        resetButton();
    } else if (message.type === 'NO_TABS') {
        // No se encontraron pestañas abiertas
        showError('No se encontraron pestañas abiertas de ChatGPT, Gemini o Claude. Por favor, abre al menos una de estas páginas.');
        resetButton();
    }

    sendResponse({ received: true });
    return true;
});

/**
 * Mostrar respuesta en la columna correspondiente
 */
function displayResponse(ai, response) {
    const element = responseElements[ai];
    if (element) {
        element.classList.remove('loading');
        element.innerHTML = `<div class="response-text">${escapeHtml(response)}</div>`;
    }
}

/**
 * Mostrar error en la columna correspondiente
 */
function displayError(ai, error) {
    const element = responseElements[ai];
    if (element) {
        element.classList.remove('loading');
        element.innerHTML = `<div class="error-message">Error: ${escapeHtml(error)}</div>`;
    }
}

/**
 * Mostrar error general
 */
function showError(message) {
    Object.values(responseElements).forEach(element => {
        element.classList.remove('loading');
        element.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
    });
}

/**
 * Resetear el botón de envío
 */
function resetButton() {
    sendButton.disabled = false;
    sendButton.textContent = 'Enviar a Todas las IAs';
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatear texto preservando saltos de línea
 */
function formatResponse(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

// Cargar el estado inicial
document.addEventListener('DOMContentLoaded', () => {
    promptInput.focus();
    console.log('Popup cargado correctamente');
});
