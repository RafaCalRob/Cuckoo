/**
 * Winner System & Markdown Rendering
 * Maneja el sistema de ganador y formateo de texto
 */

// State
let currentWinner = null;
const aiResponses = {
    chatgpt: '',
    gemini: '',
    claude: ''
};

// ===========================
// Configure Marked.js
// ===========================
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
    });
}

// ===========================
// Render Markdown
// ===========================
function renderMarkdown(text) {
    if (!text) return '';

    try {
        // Render with marked.js
        let html = marked.parse(text);

        // Apply syntax highlighting to code blocks
        if (typeof hljs !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const codeBlocks = tempDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                hljs.highlightElement(block);
            });

            html = tempDiv.innerHTML;
        }

        return html;
    } catch (error) {
        console.error('Error rendering markdown:', error);
        return escapeHtml(text);
    }
}

// ===========================
// Winner System
// ===========================
function setWinner(ai) {
    console.log('Setting winner:', ai);

    // Clear previous winner
    if (currentWinner) {
        const prevColumn = document.querySelector(`.chat-column[data-ai="${currentWinner}"]`);
        const prevBadge = document.getElementById(`winner-badge-${currentWinner}`);

        if (prevColumn) prevColumn.classList.remove('winner');
        if (prevBadge) prevBadge.classList.add('hidden');
    }

    // Set new winner
    currentWinner = ai;
    const column = document.querySelector(`.chat-column[data-ai="${ai}"]`);
    const badge = document.getElementById(`winner-badge-${ai}`);

    if (column) {
        column.classList.add('winner');
        // Smooth scroll to winner
        column.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (badge) {
        badge.classList.remove('hidden');
    }

    // Save to storage
    chrome.storage.local.set({ currentWinner: ai });

    // Show notification
    showWinnerNotification(ai);
}

function showWinnerNotification(ai) {
    const aiNames = {
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        claude: 'Claude'
    };

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'winner-notification';
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span>${aiNames[ai]} es el ganador!</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===========================
// Use as Next Prompt
// ===========================
function useAsNextPrompt(ai) {
    const response = aiResponses[ai];

    if (!response) {
        alert('No hay respuesta para usar');
        return;
    }

    // Get the prompt input
    const promptInput = document.getElementById('prompt-input');
    if (!promptInput) return;

    // Build the new prompt
    const newPrompt = `Basándote en esta respuesta:\n\n${response}\n\n`;

    // Set it in the input
    promptInput.value = newPrompt;
    promptInput.focus();

    // Scroll to input
    promptInput.scrollIntoView({ behavior: 'smooth' });

    // Update char count if function exists
    if (typeof updateCharCount === 'function') {
        updateCharCount();
    }

    // Show notification
    showUsePromptNotification(ai);
}

function showUsePromptNotification(ai) {
    const aiNames = {
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        claude: 'Claude'
    };

    const notification = document.createElement('div');
    notification.className = 'winner-notification';
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 10 4 15 9 20"></polyline>
            <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
        </svg>
        <span>Respuesta de ${aiNames[ai]} cargada como prompt</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===========================
// Enhanced Display Response
// ===========================
function displayResponseWithMarkdown(ai, response) {
    // Store the response
    aiResponses[ai] = response;

    const elementMap = {
        chatgpt: 'gpt-response',
        gemini: 'gemini-response',
        claude: 'claude-response'
    };

    const element = document.getElementById(elementMap[ai]);
    if (!element) return;

    element.classList.remove('loading');

    // Render markdown
    const renderedHtml = renderMarkdown(response);
    element.innerHTML = renderedHtml;

    // Update word count
    if (typeof updateWordCount === 'function') {
        updateWordCount(ai, response);
    }

    // Update response time
    if (typeof updateResponseTime === 'function') {
        updateResponseTime(ai);
    }

    // Update response count
    if (typeof updateResponseCount === 'function') {
        updateResponseCount();
    }

    // Auto scroll if enabled
    if (AppState && AppState.autoScroll) {
        element.scrollTop = element.scrollHeight;
    }

    // Animate in
    element.style.animation = 'fadeIn 0.5s ease-out';
}

// ===========================
// Event Listeners
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Attach winner button listeners
    document.querySelectorAll('[data-action="set-winner"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ai = e.currentTarget.dataset.ai;
            setWinner(ai);
        });
    });

    // Attach use-as-prompt button listeners
    document.querySelectorAll('[data-action="use-as-prompt"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ai = e.currentTarget.dataset.ai;
            useAsNextPrompt(ai);
        });
    });

    // Update copy button handlers
    document.querySelectorAll('[data-action="copy"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ai = e.currentTarget.dataset.ai;
            const response = aiResponses[ai];

            if (response) {
                navigator.clipboard.writeText(response).then(() => {
                    showCopyNotification();
                });
            }
        });
    });

    // Load previous winner
    chrome.storage.local.get(['currentWinner'], (data) => {
        if (data.currentWinner) {
            // Don't animate on load, just set the badge
            const badge = document.getElementById(`winner-badge-${data.currentWinner}`);
            const column = document.querySelector(`.chat-column[data-ai="${data.currentWinner}"]`);

            if (badge) badge.classList.remove('hidden');
            if (column) column.classList.add('winner');

            currentWinner = data.currentWinner;
        }
    });
});

function showCopyNotification() {
    const notification = document.createElement('div');
    notification.className = 'winner-notification';
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copiado al portapapeles!</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===========================
// Export for use in app.js
// ===========================
window.displayResponseWithMarkdown = displayResponseWithMarkdown;
window.setWinner = setWinner;
window.useAsNextPrompt = useAsNextPrompt;
window.aiResponses = aiResponses;

console.log('Winner system loaded');
