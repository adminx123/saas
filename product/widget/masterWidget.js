/*
 * Copyright (c) 2025 INEXASLI. All rights reserved.
 * This code is protected under Canadian and international copyright laws.
 * Unauthorized use, reproduction, distribution, or modification of this code 
 * without explicit written permission via email from info@inexasli.com 
 * is strictly prohibited. Violators will be pursued and prosecuted to the 
 * fullest extent of the law in British Columbia, Canada, and applicable 
 * jurisdictions worldwide.
 */

// IMPORTANT: After making changes to this file, redeploy to Cloudflare Pages. Ensure client config (window.{CLIENTNAME}_CONFIG) is set, consent screen displays, hub integration works, and copyright protection is intact.
// Generic Chat Widget Script
(function() {
    // Configuration
    let config = { agentName: 'AI Assistant' };
    
    function getClientConfig() {
        for (let key in window) {
            if (key.endsWith('_CONFIG')) {
                return window[key];
            }
        }
        return null;
    }
    
    // Default styling (will be overridden by config)
    const defaultStyling = {
        headerBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        headerColor: 'white',
        headerHeight: '60px',
        headerPadding: '15px',
        widgetBackground: 'white',
        widgetBorderRadius: '10px',
        widgetBoxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        messagesBackground: '#f8f9fa',
        inputBackground: 'white',
        inputBorder: '1px solid #ddd',
        toggleButtonBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        toggleButtonShadow: '0 4px 12px rgba(0,0,0,0.3)'
    };
    
    let currentStyling = { ...defaultStyling };
    
    // Load configuration from server
    async function loadConfig() {
        try {
            const clientConfig = getClientConfig();
            const apiUrl = clientConfig?.apiUrl;
            if (!apiUrl) {
                console.warn('No client config found (window.{CLIENTNAME}_CONFIG), using defaults');
                return;
            }
            const response = await fetch(`${apiUrl}/config`);
            if (response.ok) {
                const serverConfig = await response.json();
                config = { ...config, ...serverConfig };
                updateWidgetDisplay();
            }
        } catch (error) {
            console.warn('Failed to load chat config, using defaults:', error);
        }
    }
    
    function updateWidgetDisplay() {
        const header = chatWidget.querySelector('strong');
        if (header) {
            header.textContent = config.agentName;
        }
        
        // Update consent label with legal links
        updateConsentLabel();
        
        // Apply custom styling if available
        if (config.chatStyling) {
            applyCustomStyling(config.chatStyling);
        }
    }
    
    function updateConsentLabel() {
        const consentLabel = document.getElementById('chatConsentLabel');
        if (!consentLabel) return;
        
        const checkbox = consentLabel.querySelector('input[type="checkbox"]');
        const legalUrls = config.legalUrls || {};
        
        // Build consent text with links
        const termsLink = legalUrls.terms 
            ? `<a href="${legalUrls.terms}" target="_blank" style="color: #007bff; text-decoration: underline;">Terms of Service</a>`
            : 'Terms of Service';
        
        const privacyLink = legalUrls.privacy
            ? `<a href="${legalUrls.privacy}" target="_blank" style="color: #007bff; text-decoration: underline;">Privacy Policy</a>`
            : 'Privacy Policy';
        
        const xaiLink = '<a href="https://x.ai/legal/privacy-policy" target="_blank" style="color: #007bff; text-decoration: underline;">xAI</a>';
        
        // Update label content
        consentLabel.innerHTML = `
            <input type="checkbox" id="chatConsentCheckbox" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: top; cursor: pointer; margin-top: 2px;">
            <span style="vertical-align: top; display: inline-block; max-width: calc(100% - 30px);">
                I agree to the ${termsLink}, ${privacyLink}, and AI processing by ${xaiLink}
            </span>
        `;
        
        // Re-setup consent checkbox event listener after innerHTML update
        setupConsentCheckbox();
    }
    
    function applyCustomStyling(styling) {
        // Update current styling
        currentStyling = { ...currentStyling, ...styling };
        
        // Update header styling
        const header = chatWidget.querySelector('div:first-child');
        if (header) {
            header.style.background = currentStyling.headerBackground;
            header.style.color = currentStyling.headerColor;
            header.style.padding = currentStyling.headerPadding;
            header.style.height = currentStyling.headerHeight;
            header.style.minHeight = currentStyling.headerHeight;
        }
        
        // Update widget container
        chatWidget.style.background = currentStyling.widgetBackground;
        chatWidget.style.borderRadius = currentStyling.widgetBorderRadius;
        chatWidget.style.boxShadow = currentStyling.widgetBoxShadow;
        
        // Update messages area
        const messagesArea = document.getElementById('chatMessages');
        if (messagesArea) {
            messagesArea.style.background = currentStyling.messagesBackground;
        }
        
        // Update input area
        const inputArea = chatWidget.querySelector('div:last-child');
        if (inputArea) {
            inputArea.style.background = currentStyling.inputBackground;
            const input = document.getElementById('chatInput');
            if (input) {
                input.style.border = currentStyling.inputBorder;
            }
        }
        
        // Update toggle button
        toggleButton.style.background = currentStyling.toggleButtonBackground;
        toggleButton.style.boxShadow = currentStyling.toggleButtonShadow;
    }
    // Create chat toggle button
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '💬';
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: ${currentStyling.toggleButtonBackground};
        border-radius: 50%;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        z-index: 10001;
        box-shadow: ${currentStyling.toggleButtonShadow};
    `;
    document.body.appendChild(toggleButton);

    // Create chat widget
    const chatWidget = document.createElement('div');
    chatWidget.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: ${currentStyling.widgetBackground};
        border-radius: ${currentStyling.widgetBorderRadius};
        box-shadow: ${currentStyling.widgetBoxShadow};
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
        flex-direction: column;
    `;

    chatWidget.innerHTML = `
        <div style="background: ${currentStyling.headerBackground}; color: ${currentStyling.headerColor}; padding: ${currentStyling.headerPadding}; border-radius: 10px 10px 0 0; height: ${currentStyling.headerHeight}; min-height: ${currentStyling.headerHeight}; display: flex; align-items: center; justify-content: space-between;">
            <strong>${config.agentName}</strong>
            <a href="#" onclick="window.showChatPrivacy && window.showChatPrivacy(); return false;" style="color: white; font-size: 12px; text-decoration: underline; opacity: 0.9;">Privacy</a>
        </div>
        <div id="chatConsent" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; background: #f8f9fa; height: 100%;">
            <div style="text-align: center; max-width: 280px;">
                <div style="font-size: 40px; margin-bottom: 15px;">🤖</div>
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">AI-Powered Chat</h3>
                <p style="color: #666; font-size: 13px; line-height: 1.5; margin-bottom: 15px;">
                    This chat uses AI to answer your questions. Your messages are processed by our AI service provider. 
                    <a href="#" onclick="window.showChatPrivacy && window.showChatPrivacy(); return false;" style="color: #007bff;">Learn more</a>
                </p>
                <label id="chatConsentLabel" style="text-align: left; font-size: 12px; color: #666; margin-bottom: 15px; cursor: pointer; line-height: 1.6;">
                    <input type="checkbox" id="chatConsentCheckbox" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: top; cursor: pointer; margin-top: 2px;">
                    <span style="vertical-align: top; display: inline-block; max-width: calc(100% - 30px);">I agree to the Terms of Service, Privacy Policy, and AI processing by xAI</span>
                </label>
                <button id="startChatButton" disabled style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 20px; font-size: 14px; cursor: not-allowed; opacity: 0.5;">
                    Start Chat
                </button>
            </div>
        </div>
        <div id="chatMessages" style="display: none; flex: 1; padding: 15px; overflow-y: auto; background: ${currentStyling.messagesBackground};">
            <div style="margin-bottom: 10px; padding: 8px 12px; border-radius: 18px; max-width: 80%; word-wrap: break-word; background: white; color: #333; border: 1px solid #e9ecef;">Hello! I'm your AI assistant. How can I help you today?</div>
        </div>
        <div id="typingIndicator" style="display: none; font-style: italic; color: #666; padding: 8px 12px;">AI is typing...</div>
        <div id="chatInputArea" style="display: none; padding: 15px; border-top: 1px solid #e9ecef; background: ${currentStyling.inputBackground}; border-radius: 0 0 10px 10px;">
            <input type="text" id="chatInput" placeholder="Type your message..." style="width: 100%; padding: 10px; border: ${currentStyling.inputBorder}; border-radius: 20px; outline: none; font-size: 14px;">
        </div>
    `;

    document.body.appendChild(chatWidget);

    let isOpen = false;
    let consentGiven = false;

    // Check if consent was previously given
    const savedConsent = localStorage.getItem('chatWidgetConsent');
    if (savedConsent === 'true') {
        consentGiven = true;
        showChatInterface();
    }

    // Setup consent checkbox and button event listeners
    setupConsentCheckbox();
    
    function setupConsentCheckbox() {
        const consentCheckbox = document.getElementById('chatConsentCheckbox');
        const startChatButton = document.getElementById('startChatButton');
        
        if (consentCheckbox && startChatButton) {
            consentCheckbox.onchange = function() {
                if (this.checked) {
                    startChatButton.disabled = false;
                    startChatButton.style.cursor = 'pointer';
                    startChatButton.style.opacity = '1';
                } else {
                    startChatButton.disabled = true;
                    startChatButton.style.cursor = 'not-allowed';
                    startChatButton.style.opacity = '0.5';
                }
            };

            startChatButton.onclick = function() {
                if (consentCheckbox.checked) {
                    consentGiven = true;
                    localStorage.setItem('chatWidgetConsent', 'true');
                    showChatInterface();
                }
            };
        }
    }

    function showChatInterface() {
        const consentDiv = document.getElementById('chatConsent');
        const messagesDiv = document.getElementById('chatMessages');
        const inputArea = document.getElementById('chatInputArea');
        
        if (consentDiv) consentDiv.style.display = 'none';
        if (messagesDiv) {
            messagesDiv.style.display = 'flex';
            messagesDiv.style.flexDirection = 'column';
        }
        if (inputArea) inputArea.style.display = 'block';
    }

    // Load configuration on initialization
    loadConfig();

    toggleButton.onclick = function() {
        isOpen = !isOpen;
        chatWidget.style.display = isOpen ? 'flex' : 'none';
    };

    const input = document.getElementById('chatInput');
    input.onkeypress = function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    function sendMessage() {
        if (!consentGiven) {
            alert('Please accept the data processing terms to use chat.');
            return;
        }

        const message = input.value.trim();
        if (!message) return;

        const clientConfig = getClientConfig();
        const apiUrl = 'https://orchestrator.4hm7q4q75z.workers.dev'; // Updated to current orchestrator URL
        if (!apiUrl) {
            addMessage('Chat not configured properly.', 'bot');
            return;
        }

        addMessage(message, 'user');
        input.value = '';

        document.getElementById('typingIndicator').style.display = 'block';

        fetch(`${apiUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputType: 'chat',
                message: message,
                sessionId: getSessionId()
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('typingIndicator').style.display = 'none';
            if (data.reply) {
                addMessage(data.reply, 'bot');
            } else if (data.error) {
                addMessage(`Error: ${data.error}`, 'bot');
            } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        })
        .catch(error => {
            document.getElementById('typingIndicator').style.display = 'none';
            addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
            console.error('Chat error:', error);
        });
    }

    function addMessage(text, type) {
        const messages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 18px;
            max-width: 80%;
            word-wrap: break-word;
            ${type === 'user' ?
                'background: #007bff; color: white; margin-left: auto; text-align: right;' :
                'background: white; color: #333; border: 1px solid #e9ecef;'
            }
        `;
        messageDiv.textContent = text;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function getSessionId() {
        let sessionId = localStorage.getItem('chatWidgetSessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatWidgetSessionId', sessionId);
        }
        return sessionId;
    }

    // Make sendMessage available globally for potential manual triggering
    window.chatWidgetSend = sendMessage;

    // Privacy notice function
    window.showChatPrivacy = function() {
        const privacyNotice = `
This AI chat widget is provided by INEXASLI and processes your messages using third-party AI services (xAI).

Data Collected:
• Your chat messages and questions
• Session information (stored locally in your browser)
• Conversation history during your session

How Data is Used:
• Sent to xAI API to generate AI responses
• Stored temporarily to maintain conversation context
• Used to improve service quality

Data Sharing:
• Your messages are transmitted to xAI (X.AI Corp) for AI processing
• xAI Privacy Policy: https://x.ai/legal/privacy-policy

Your Rights:
• You can stop using the chat at any time
• Clear your browser's localStorage to delete session data
• Contact the website owner to request deletion of chat history

For more information, contact the website owner or visit INEXASLI's Data Processing Agreement.
        `;
        alert(privacyNotice);
    };
})();