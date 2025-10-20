/**
 * Content Script V2 - Sistema Simplificado con Clipboard
 * Estrategia: Mostrar notificación flotante para que el usuario pegue el prompt
 */

if (!window.multiChatAIInjected) {
    window.multiChatAIInjected = true;

    console.log('Multi-Chat AI - Content Script V2 cargado');

    // Estado
    let currentPrompt = '';
    let notificationElement = null;

    // Escuchar mensajes del background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Content script recibió:', message.type);

        if (message.type === 'SHOW_PASTE_NOTIFICATION') {
            currentPrompt = message.prompt;
            showPasteNotification(message.aiType, message.prompt);
            sendResponse({ success: true });
        } else if (message.type === 'AUTO_PASTE') {
            currentPrompt = message.prompt;
            attemptAutoPaste(message.aiType, message.prompt);
            sendResponse({ success: true });
        }

        return true;
    });

    /**
     * Mostrar notificación flotante con instrucciones
     */
    function showPasteNotification(aiType, prompt) {
        // Remover notificación anterior si existe
        if (notificationElement) {
            notificationElement.remove();
        }

        // Crear notificación
        notificationElement = document.createElement('div');
        notificationElement.id = 'multi-chat-ai-notification';
        notificationElement.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <strong style="font-size: 16px;">Prompt Copiado</strong>
                </div>

                <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.95;">
                    Tu prompt está en el portapapeles. Haz clic en el campo de texto y pega:
                </p>

                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="multi-chat-paste-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        <span>⌨️</span> Ctrl+V / Cmd+V
                    </button>

                    <button id="multi-chat-auto-paste-btn" style="
                        background: rgba(255,255,255,0.9);
                        border: none;
                        color: #667eea;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='white'"
                       onmouseout="this.style.style.background='rgba(255,255,255,0.9)'">
                        <span>🚀</span> Pegar Automáticamente
                    </button>

                    <button id="multi-chat-close-btn" style="
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                       onmouseout="this.style.background='transparent'">
                        ✕
                    </button>
                </div>

                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <details style="cursor: pointer;">
                        <summary style="font-size: 12px; opacity: 0.8;">Ver prompt (${prompt.length} caracteres)</summary>
                        <div style="
                            margin-top: 8px;
                            padding: 10px;
                            background: rgba(0,0,0,0.2);
                            border-radius: 6px;
                            font-size: 12px;
                            max-height: 150px;
                            overflow-y: auto;
                            white-space: pre-wrap;
                            word-break: break-word;
                        ">${escapeHtml(prompt.substring(0, 500))}${prompt.length > 500 ? '...' : ''}</div>
                    </details>
                </div>
            </div>
        `;

        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notificationElement);

        // Event listeners
        document.getElementById('multi-chat-close-btn').addEventListener('click', () => {
            notificationElement.remove();
        });

        document.getElementById('multi-chat-auto-paste-btn').addEventListener('click', () => {
            attemptAutoPaste(aiType, prompt);
        });

        // Auto-cerrar después de 30 segundos
        setTimeout(() => {
            if (notificationElement && notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, 30000);
    }

    /**
     * Intentar pegar automáticamente
     */
    async function attemptAutoPaste(aiType, prompt) {
        console.log('Intentando auto-paste para', aiType);

        try {
            // Estrategia 1: Buscar el campo de entrada más probable
            const inputField = findInputField();

            if (!inputField) {
                showError('No se encontró el campo de texto. Por favor pega manualmente con Ctrl+V');
                return;
            }

            // Enfocar y pegar
            inputField.focus();
            await sleep(200);

            // Intentar múltiples métodos
            let success = false;

            // Método 1: execCommand (deprecated pero funciona)
            try {
                inputField.focus();
                document.execCommand('paste');
                success = true;
            } catch (e) {
                console.log('execCommand falló:', e);
            }

            // Método 2: Insertar texto directamente
            if (!success) {
                await insertTextDirect(inputField, prompt);
                success = true;
            }

            if (success) {
                showSuccess('✅ Texto pegado correctamente');

                // Intentar enviar automáticamente después de 1 segundo
                setTimeout(() => {
                    const sendButton = findSendButton();
                    if (sendButton) {
                        sendButton.click();
                        console.log('Botón de envío clickeado automáticamente');
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error en auto-paste:', error);
            showError('Error al pegar. Usa Ctrl+V manualmente');
        }
    }

    /**
     * Buscar campo de entrada (estrategia simple)
     */
    function findInputField() {
        // Buscar textarea visible
        const textareas = Array.from(document.querySelectorAll('textarea'));
        const visibleTextarea = textareas.find(ta => ta.offsetParent !== null);
        if (visibleTextarea) return visibleTextarea;

        // Buscar contenteditable visible
        const editables = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        const visibleEditable = editables.find(el => el.offsetParent !== null && el.offsetHeight > 30);
        if (visibleEditable) return visibleEditable;

        return null;
    }

    /**
     * Buscar botón de envío
     */
    function findSendButton() {
        // Buscar botones con textos/atributos comunes
        const buttons = Array.from(document.querySelectorAll('button'));

        for (const btn of buttons) {
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const text = btn.textContent || '';

            if (ariaLabel.toLowerCase().includes('send') ||
                ariaLabel.toLowerCase().includes('enviar') ||
                text.toLowerCase().includes('send') ||
                text.toLowerCase().includes('enviar') ||
                btn.type === 'submit') {

                // Verificar que esté visible y no deshabilitado
                if (btn.offsetParent !== null && !btn.disabled) {
                    return btn;
                }
            }
        }

        return null;
    }

    /**
     * Insertar texto directamente
     */
    async function insertTextDirect(element, text) {
        element.focus();

        if (element.contentEditable === 'true') {
            element.textContent = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    function showSuccess(message) {
        updateNotification(message, '#10b981');
    }

    /**
     * Mostrar mensaje de error
     */
    function showError(message) {
        updateNotification(message, '#ef4444');
    }

    /**
     * Actualizar notificación
     */
    function updateNotification(message, color) {
        if (notificationElement) {
            const div = notificationElement.querySelector('div');
            div.style.background = color;
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <strong style="font-size: 16px;">${message}</strong>
                </div>
            `;

            setTimeout(() => {
                if (notificationElement) {
                    notificationElement.remove();
                }
            }, 3000);
        }
    }

    /**
     * Utilidades
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('Content Script V2 listo');
}
