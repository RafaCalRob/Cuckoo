/**
 * Sidebar Flotante para Multi-Chat AI
 * Permite chatear con las IAs desde cualquier página web
 */

(function() {
    'use strict';

    // Evitar múltiples inyecciones
    if (window.multiChatAISidebarInjected) {
        // Si ya existe, solo toggle
        toggleSidebar();
        return;
    }
    window.multiChatAISidebarInjected = true;

    console.log('[Multi-Chat AI] Inyectando sidebar...');

    // Estado del sidebar
    let isOpen = false;
    let currentAI = 'chatgpt';

    /**
     * Crear el HTML del sidebar
     */
    function createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'multi-chat-ai-sidebar';
        sidebar.className = 'mcai-sidebar';
        sidebar.innerHTML = `
            <div class="mcai-sidebar-header">
                <div class="mcai-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18.5c-3.86-.93-7-4.83-7-8.5V8.3l7-3.5 7 3.5V12c0 3.67-3.14 7.57-7 8.5z"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    <span>Multi-Chat AI</span>
                </div>
                <div class="mcai-actions">
                    <button class="mcai-btn-icon" id="mcai-minimize" title="Minimizar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button class="mcai-btn-icon" id="mcai-close" title="Cerrar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="mcai-sidebar-body">
                <!-- AI Selector -->
                <div class="mcai-ai-selector">
                    <button class="mcai-ai-btn active" data-ai="chatgpt">
                        <span class="mcai-ai-dot" style="background: #10a37f;"></span>
                        ChatGPT
                    </button>
                    <button class="mcai-ai-btn" data-ai="gemini">
                        <span class="mcai-ai-dot" style="background: #4285f4;"></span>
                        Gemini
                    </button>
                    <button class="mcai-ai-btn" data-ai="claude">
                        <span class="mcai-ai-dot" style="background: #cc785c;"></span>
                        Claude
                    </button>
                    <button class="mcai-ai-btn" data-ai="all">
                        <span class="mcai-ai-dot" style="background: linear-gradient(45deg, #10a37f, #4285f4, #cc785c);"></span>
                        Todas
                    </button>
                </div>

                <!-- Chat Container -->
                <div class="mcai-chat-container" id="mcai-chat-container">
                    <div class="mcai-welcome">
                        <h3>👋 ¡Hola!</h3>
                        <p>Selecciona una IA y escribe tu pregunta</p>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="mcai-status" id="mcai-status">
                    <span class="mcai-status-text">Listo</span>
                </div>

                <!-- Input Area -->
                <div class="mcai-input-area">
                    <textarea
                        id="mcai-input"
                        placeholder="Escribe tu pregunta..."
                        rows="3"
                    ></textarea>
                    <div class="mcai-input-footer">
                        <button class="mcai-btn-send" id="mcai-send">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                            Enviar
                        </button>
                        <button class="mcai-btn-secondary" id="mcai-clear">Limpiar</button>
                    </div>
                </div>
            </div>

            <!-- Resize Handle -->
            <div class="mcai-resize-handle" id="mcai-resize-handle"></div>
        `;

        document.body.appendChild(sidebar);

        // Event listeners
        setupEventListeners();

        // Animación de entrada
        setTimeout(() => {
            sidebar.classList.add('mcai-sidebar-open');
            isOpen = true;
        }, 10);
    }

    /**
     * Configurar event listeners
     */
    function setupEventListeners() {
        // Cerrar sidebar
        document.getElementById('mcai-close').addEventListener('click', closeSidebar);

        // Minimizar
        document.getElementById('mcai-minimize').addEventListener('click', toggleMinimize);

        // Selector de IA
        document.querySelectorAll('.mcai-ai-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mcai-ai-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentAI = btn.dataset.ai;
                console.log('[Multi-Chat AI] IA seleccionada:', currentAI);
            });
        });

        // Enviar mensaje
        document.getElementById('mcai-send').addEventListener('click', sendMessage);

        // Limpiar chat
        document.getElementById('mcai-clear').addEventListener('click', clearChat);

        // Enter para enviar (Ctrl+Enter)
        document.getElementById('mcai-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Resize
        setupResize();

        // Drag (mover sidebar)
        setupDrag();
    }

    /**
     * Enviar mensaje
     */
    async function sendMessage() {
        const input = document.getElementById('mcai-input');
        const prompt = input.value.trim();

        if (!prompt) return;

        console.log('[Multi-Chat AI] Enviando:', prompt);

        // Mostrar mensaje del usuario
        addMessage('user', prompt);

        // Limpiar input
        input.value = '';

        // Actualizar status
        updateStatus('Enviando...', 'loading');

        // Determinar IAs a usar
        const ais = currentAI === 'all'
            ? ['chatgpt', 'gemini', 'claude']
            : [currentAI];

        // Enviar al background
        try {
            chrome.runtime.sendMessage({
                type: 'SEND_PROMPT',
                prompt: prompt,
                selectedAIs: ais
            });

            // Agregar placeholders para las respuestas
            if (currentAI === 'all') {
                addMessage('chatgpt', '⏳ Esperando respuesta de ChatGPT...', true);
                addMessage('gemini', '⏳ Esperando respuesta de Gemini...', true);
                addMessage('claude', '⏳ Esperando respuesta de Claude...', true);
            } else {
                addMessage(currentAI, '⏳ Generando respuesta...', true);
            }

        } catch (error) {
            console.error('[Multi-Chat AI] Error:', error);
            updateStatus('Error al enviar', 'error');
            addMessage('system', '❌ Error al enviar el mensaje');
        }
    }

    /**
     * Agregar mensaje al chat
     */
    function addMessage(type, text, isPlaceholder = false) {
        const chatContainer = document.getElementById('mcai-chat-container');

        // Remover welcome si existe
        const welcome = chatContainer.querySelector('.mcai-welcome');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `mcai-message mcai-message-${type}`;
        if (isPlaceholder) messageDiv.classList.add('mcai-placeholder');
        messageDiv.dataset.ai = type;

        const avatar = getAvatar(type);
        const content = document.createElement('div');
        content.className = 'mcai-message-content';
        content.textContent = text;

        messageDiv.innerHTML = `
            <div class="mcai-message-avatar">${avatar}</div>
            <div class="mcai-message-content">${escapeHtml(text)}</div>
        `;

        chatContainer.appendChild(messageDiv);

        // Scroll al final
        chatContainer.scrollTop = chatContainer.scrollHeight;

        return messageDiv;
    }

    /**
     * Actualizar mensaje (para streaming)
     */
    function updateMessage(aiType, text) {
        const chatContainer = document.getElementById('mcai-chat-container');
        const messages = chatContainer.querySelectorAll(`.mcai-message[data-ai="${aiType}"]`);

        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const content = lastMessage.querySelector('.mcai-message-content');
            content.textContent = text;
            lastMessage.classList.remove('mcai-placeholder');

            // Scroll al final
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            // No hay mensaje aún, crearlo
            addMessage(aiType, text);
        }
    }

    /**
     * Obtener avatar según el tipo
     */
    function getAvatar(type) {
        const avatars = {
            user: '👤',
            chatgpt: '🤖',
            gemini: '✨',
            claude: '🎨',
            system: 'ℹ️'
        };
        return avatars[type] || '🤖';
    }

    /**
     * Escapar HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Actualizar status
     */
    function updateStatus(text, type = 'normal') {
        const status = document.getElementById('mcai-status');
        const statusText = status.querySelector('.mcai-status-text');
        statusText.textContent = text;
        status.className = `mcai-status mcai-status-${type}`;
    }

    /**
     * Limpiar chat
     */
    function clearChat() {
        const chatContainer = document.getElementById('mcai-chat-container');
        chatContainer.innerHTML = `
            <div class="mcai-welcome">
                <h3>👋 ¡Hola!</h3>
                <p>Selecciona una IA y escribe tu pregunta</p>
            </div>
        `;
        updateStatus('Listo', 'normal');
    }

    /**
     * Toggle minimizar
     */
    function toggleMinimize() {
        const sidebar = document.getElementById('multi-chat-ai-sidebar');
        sidebar.classList.toggle('mcai-sidebar-minimized');
    }

    /**
     * Cerrar sidebar
     */
    function closeSidebar() {
        const sidebar = document.getElementById('multi-chat-ai-sidebar');
        sidebar.classList.remove('mcai-sidebar-open');
        setTimeout(() => {
            sidebar.remove();
            window.multiChatAISidebarInjected = false;
        }, 300);
    }

    /**
     * Toggle sidebar
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('multi-chat-ai-sidebar');
        if (sidebar) {
            if (sidebar.classList.contains('mcai-sidebar-open')) {
                closeSidebar();
            } else {
                sidebar.classList.add('mcai-sidebar-open');
            }
        }
    }

    /**
     * Setup resize
     */
    function setupResize() {
        const handle = document.getElementById('mcai-resize-handle');
        const sidebar = document.getElementById('multi-chat-ai-sidebar');

        let isResizing = false;
        let startX, startWidth;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = startX - e.clientX;
            const newWidth = startWidth + diff;

            if (newWidth >= 300 && newWidth <= 800) {
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    }

    /**
     * Setup drag (mover el sidebar)
     */
    function setupDrag() {
        const header = document.querySelector('.mcai-sidebar-header');
        const sidebar = document.getElementById('multi-chat-ai-sidebar');

        let isDragging = false;
        let startY, startTop;

        header.addEventListener('mousedown', (e) => {
            // Solo si no es en un botón
            if (e.target.closest('button')) return;

            isDragging = true;
            startY = e.clientY;
            const rect = sidebar.getBoundingClientRect();
            startTop = rect.top;
            header.style.cursor = 'move';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const diff = e.clientY - startY;
            const newTop = startTop + diff;

            if (newTop >= 0 && newTop <= window.innerHeight - 100) {
                sidebar.style.top = newTop + 'px';
                sidebar.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = '';
            }
        });
    }

    /**
     * Escuchar mensajes de streaming
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'STREAMING_UPDATE') {
            console.log('[Multi-Chat AI Sidebar] Streaming update:', message.ai);
            updateMessage(message.ai, message.response);
            updateStatus('Recibiendo...', 'loading');
        }
        else if (message.type === 'RESPONSE_RECEIVED') {
            console.log('[Multi-Chat AI Sidebar] Respuesta completa:', message.ai);
            updateMessage(message.ai, message.response);
            updateStatus('Listo', 'success');
        }
        else if (message.type === 'ERROR') {
            console.error('[Multi-Chat AI Sidebar] Error:', message.error);
            addMessage('system', `❌ Error en ${message.ai}: ${message.error}`);
            updateStatus('Error', 'error');
        }
        else if (message.type === 'TOGGLE_SIDEBAR') {
            toggleSidebar();
        }

        sendResponse({ received: true });
        return true;
    });

    // Crear el sidebar
    createSidebar();

    console.log('[Multi-Chat AI] ✓ Sidebar inyectado correctamente');
})();
