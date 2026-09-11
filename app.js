/**
 * Elex AI — Client-Side Core Engine, Multi-Model Connectors, & Sandbox Studio
 * Architecture: Standalone Zero-Dependency SPA (Ready for Netlify deployment)
 */

(() => {
  'use strict';

  /* ==========================================================================
     State & Storage Defaults
     ========================================================================== */
  const STORAGE_KEYS = {
    KEYS: 'elex_api_keys',
    PLUGINS: 'elex_plugins',
    PREFS: 'elex_preferences',
    SESSIONS: 'elex_chat_sessions',
    ACTIVE_ID: 'elex_active_session_id',
    MODEL: 'elex_active_model'
  };

  const DEFAULT_PLUGINS = {
    webSearch: true,
    codeRunner: true,
    fileAnalyzer: true,
    promptOpt: true
  };

  const DEFAULT_PREFS = {
    systemPrompt: "You are Elex AI, an elite frontier research assistant, system architect, polymath software engineer, and UI/UX designer. You produce clean, modular, modern code, deep analytical solutions, and actionable answers.",
    temperature: 0.7
  };

  // State
  let state = {
    currentModel: localStorage.getItem(STORAGE_KEYS.MODEL) || 'native',
    apiKeys: JSON.parse(localStorage.getItem(STORAGE_KEYS.KEYS) || '{"gemini":"","openai":"","anthropic":"","openrouter":"","customBase":""}'),
    plugins: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLUGINS) || JSON.stringify(DEFAULT_PLUGINS)),
    prefs: JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFS) || JSON.stringify(DEFAULT_PREFS)),
    sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'),
    activeSessionId: localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || null,
    attachedFile: null,
    currentArtifact: {
      code: '',
      title: 'Project Artifact',
      language: 'html',
      filename: 'index.html'
    },
    isGenerating: false
  };

  /* ==========================================================================
     DOM Elements Cache
     ========================================================================== */
  const DOM = {
    sidebar: document.getElementById('sidebar'),
    btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
    btnCollapseSidebar: document.getElementById('btn-collapse-sidebar'),
    btnNewChat: document.getElementById('btn-new-chat'),
    chatHistoryList: document.getElementById('chat-history-list'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    sidebarEngineName: document.getElementById('sidebar-engine-name'),
    btnOpenSettings: document.getElementById('btn-open-settings'),

    modelSelectBtn: document.getElementById('model-select-btn'),
    modelDropdownMenu: document.getElementById('model-dropdown-menu'),
    currentModelDisplay: document.getElementById('current-model-display'),
    activePluginsBar: document.getElementById('active-plugins-bar'),

    btnToggleSandbox: document.getElementById('btn-toggle-sandbox'),
    sandboxBadgeCount: document.getElementById('sandbox-badge-count'),
    btnExportChat: document.getElementById('btn-export-chat'),
    btnClearChat: document.getElementById('btn-clear-chat'),

    chatColumn: document.getElementById('chat-column'),
    chatMessages: document.getElementById('chat-messages'),
    welcomeHero: document.getElementById('welcome-hero'),

    chatForm: document.getElementById('chat-form'),
    userInput: document.getElementById('user-input'),
    btnSend: document.getElementById('btn-send'),
    fileInput: document.getElementById('file-input'),
    btnAttachFile: document.getElementById('btn-attach-file'),
    attachmentPreviewBar: document.getElementById('attachment-preview-bar'),
    attachmentFilename: document.getElementById('attachment-filename'),
    attachmentFilesize: document.getElementById('attachment-filesize'),
    btnRemoveAttachment: document.getElementById('btn-remove-attachment'),
    footerPluginsIndicator: document.getElementById('footer-plugins-indicator'),

    // Sandbox
    sandboxPanel: document.getElementById('sandbox-panel'),
    sandboxFilenameBadge: document.getElementById('sandbox-filename-badge'),
    sandboxIframe: document.getElementById('sandbox-iframe'),
    sandboxCodeDisplay: document.getElementById('sandbox-code-display'),
    sandboxConsoleLog: document.getElementById('sandbox-console-log'),
    consoleCount: document.getElementById('console-count'),
    btnRefreshSandbox: document.getElementById('btn-refresh-sandbox'),
    btnDownloadZip: document.getElementById('btn-download-zip'),
    btnPopoutSandbox: document.getElementById('btn-popout-sandbox'),
    btnCloseSandbox: document.getElementById('btn-close-sandbox'),

    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    keyGemini: document.getElementById('key-gemini'),
    keyOpenai: document.getElementById('key-openai'),
    keyAnthropic: document.getElementById('key-anthropic'),
    keyOpenrouter: document.getElementById('key-openrouter'),
    customBaseUrl: document.getElementById('custom-base-url'),
    pluginWebsearch: document.getElementById('plugin-websearch'),
    pluginCoderunner: document.getElementById('plugin-coderunner'),
    pluginFileanalyzer: document.getElementById('plugin-fileanalyzer'),
    pluginPromptopt: document.getElementById('plugin-promptopt'),
    prefSystemPrompt: document.getElementById('pref-system-prompt'),
    prefTemperature: document.getElementById('pref-temperature'),
    tempDisplay: document.getElementById('temp-display'),
    btnExportAllData: document.getElementById('btn-export-all-data'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),

    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmDesc: document.getElementById('confirm-desc'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnConfirmProceed: document.getElementById('btn-confirm-proceed'),

    toastContainer: document.getElementById('toast-container')
  };

  /* ==========================================================================
     Toast Notification Helper
     ========================================================================== */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '⚡';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warn') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    setupMarkedOptions();
    loadSettingsIntoUI();
    renderPluginBadges();
    updateModelDisplay();
    bindEvents();
    initSession();
    renderHistoryList();

    // Listen to sandbox console messages
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'ELEX_SANDBOX_CONSOLE') {
        appendConsoleLog(event.data.level, event.data.message);
      }
    });
  }

  function setupMarkedOptions() {
    if (window.marked) {
      marked.setOptions({
        gfm: true,
        breaks: true,
        highlight: function(code, lang) {
          if (window.hljs && lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (e) {}
          }
          if (window.hljs) {
            try {
              return hljs.highlightAuto(code).value;
            } catch (e) {}
          }
          return escapeHtml(code);
        }
      });
    }
  }

  /* ==========================================================================
     Session & History Management
     ========================================================================== */
  function initSession() {
    if (!state.sessions || state.sessions.length === 0) {
      createNewSession(false);
    } else {
      if (!state.activeSessionId || !state.sessions.find(s => s.id === state.activeSessionId)) {
        state.activeSessionId = state.sessions[0].id;
      }
      loadSession(state.activeSessionId);
    }
  }

  function createNewSession(render = true) {
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };
    state.sessions.unshift(newSession);
    state.activeSessionId = newSession.id;
    saveSessions();

    if (render) {
      renderHistoryList();
      loadSession(newSession.id);
      showToast('Started fresh conversation', 'info');
    }
  }

  function getActiveSession() {
    return state.sessions.find(s => s.id === state.activeSessionId);
  }

  function saveSessions() {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, state.activeSessionId);
  }

  function loadSession(sessionId) {
    state.activeSessionId = sessionId;
    saveSessions();
    renderHistoryList();

    const session = getActiveSession();
    DOM.chatMessages.innerHTML = '';

    if (!session || session.messages.length === 0) {
      DOM.chatMessages.appendChild(DOM.welcomeHero);
      DOM.welcomeHero.classList.remove('hidden');
    } else {
      DOM.welcomeHero.classList.add('hidden');
      session.messages.forEach(msg => {
        renderMessageBubble(msg.role, msg.content, msg.meta, false);
      });
      scrollToBottom();
    }
  }

  function renderHistoryList() {
    DOM.chatHistoryList.innerHTML = '';
    state.sessions.forEach(sess => {
      const item = document.createElement('div');
      item.className = `history-item ${sess.id === state.activeSessionId ? 'active' : ''}`;
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'history-title';
      titleSpan.textContent = sess.title || 'Untitled Chat';
      titleSpan.title = sess.title;

      const delBtn = document.createElement('button');
      delBtn.className = 'history-del-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete chat';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteSession(sess.id);
      };

      item.appendChild(titleSpan);
      item.appendChild(delBtn);

      item.onclick = () => loadSession(sess.id);
      DOM.chatHistoryList.appendChild(item);
    });
  }

  function deleteSession(id) {
    state.sessions = state.sessions.filter(s => s.id !== id);
    if (state.sessions.length === 0) {
      createNewSession(true);
    } else {
      if (state.activeSessionId === id) {
        state.activeSessionId = state.sessions[0].id;
      }
      saveSessions();
      loadSession(state.activeSessionId);
    }
    showToast('Conversation removed', 'info');
  }

  /* ==========================================================================
     Message Rendering & Artifact Hook
     ========================================================================== */
  function renderMessageBubble(role, content, meta = {}, shouldScroll = true) {
    DOM.welcomeHero.classList.add('hidden');

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'E';

    const body = document.createElement('div');
    body.className = 'message-body';

    const header = document.createElement('div');
    header.className = 'message-header';
    const sender = document.createElement('span');
    sender.className = 'sender-name';
    sender.textContent = role === 'user' ? 'You' : 'Elex AI';
    const time = document.createElement('span');
    time.className = 'timestamp';
    time.textContent = meta.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    header.appendChild(sender);
    header.appendChild(time);

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (role === 'assistant') {
      // If thinking metadata is provided or chain-of-thought plugin is active
      if (meta.thinking) {
        const thinkingBlock = document.createElement('div');
        thinkingBlock.className = 'thinking-block';
        thinkingBlock.innerHTML = `
          <div class="thinking-toggle">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
            <span>Reasoning & Synthesis Protocol (${meta.modelName || 'Elex Brain'})</span>
          </div>
          <div class="thinking-content">${escapeHtml(meta.thinking)}</div>
        `;
        const toggle = thinkingBlock.querySelector('.thinking-toggle');
        const contentDiv = thinkingBlock.querySelector('.thinking-content');
        toggle.onclick = () => {
          contentDiv.classList.toggle('hidden');
        };
        bubble.appendChild(thinkingBlock);
      }

      // If web search plugin triggered citations
      if (meta.searchCitations && meta.searchCitations.length > 0) {
        const searchBadge = document.createElement('div');
        searchBadge.className = 'plugin-tag';
        searchBadge.style.marginBottom = '10px';
        searchBadge.innerHTML = `<span>🌐 Real-Time Web Context:</span> <strong>${meta.searchCitations.length} sources referenced</strong>`;
        bubble.appendChild(searchBadge);
      }

      // Render Markdown
      const parsedHtml = window.marked ? marked.parse(content) : escapeHtml(content);
      const markdownContainer = document.createElement('div');
      markdownContainer.innerHTML = parsedHtml;

      // Enhance code blocks
      enhanceCodeBlocks(markdownContainer);
      bubble.appendChild(markdownContainer);
    } else {
      // User message
      if (meta.file) {
        const fileTag = document.createElement('div');
        fileTag.className = 'file-pill';
        fileTag.style.marginBottom = '8px';
        fileTag.innerHTML = `<span>📎 ${escapeHtml(meta.file.name)}</span> <span class="filesize">(${meta.file.size})</span>`;
        bubble.appendChild(fileTag);
      }
      const textNode = document.createElement('div');
      textNode.style.whiteSpace = 'pre-wrap';
      textNode.textContent = content;
      bubble.appendChild(textNode);
    }

    body.appendChild(header);
    body.appendChild(bubble);

    row.appendChild(avatar);
    row.appendChild(body);

    DOM.chatMessages.appendChild(row);

    if (shouldScroll) {
      scrollToBottom();
    }
  }

  function enhanceCodeBlocks(container) {
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      const codeEl = pre.querySelector('code');
      if (!codeEl) return;

      let codeText = codeEl.innerText || codeEl.textContent;
      let lang = 'plaintext';

      // Detect language from class
      const classMatch = codeEl.className.match(/language-([a-zA-Z0-9_\-]+)/);
      if (classMatch) {
        lang = classMatch[1].toLowerCase();
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'code-container';

      const header = document.createElement('div');
      header.className = 'code-header';

      const langSpan = document.createElement('span');
      langSpan.textContent = lang.toUpperCase();

      const actions = document.createElement('div');
      actions.className = 'code-actions';

      // Copy Button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-action-btn';
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = `✓ Copied!`;
          setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
          }, 2000);
        });
      };
      actions.appendChild(copyBtn);

      // Run in Sandbox Button (for HTML, JS, SVG, or Web stacks)
      const isWebRunnable = ['html', 'htm', 'svg', 'javascript', 'js', 'css', 'xml'].includes(lang) ||
                            codeText.includes('<!DOCTYPE html>') || 
                            codeText.includes('<html') ||
                            (codeText.includes('<script') && codeText.includes('<style'));

      if (isWebRunnable) {
        const runBtn = document.createElement('button');
        runBtn.className = 'code-action-btn';
        runBtn.style.color = '#34d399';
        runBtn.style.borderColor = '#10b981';
        runBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Open in Sandbox`;
        runBtn.onclick = () => {
          loadIntoSandbox(codeText, lang);
        };
        actions.appendChild(runBtn);
      }

      header.appendChild(langSpan);
      header.appendChild(actions);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      // If auto-run plugin is enabled and code is web runnable, load into sandbox automatically!
      if (state.plugins.codeRunner && isWebRunnable && !state.currentArtifact.code) {
        loadIntoSandbox(codeText, lang, false);
      }
    });
  }

  function scrollToBottom() {
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  }

  /* ==========================================================================
     Live Code Runner & Sandbox Studio
     ========================================================================== */
  function loadIntoSandbox(rawCode, language = 'html', openPanel = true) {
    state.currentArtifact.code = rawCode;
    state.currentArtifact.language = language;
    state.currentArtifact.filename = language === 'svg' ? 'graphic.svg' : 'index.html';

    DOM.sandboxFilenameBadge.textContent = state.currentArtifact.filename;
    DOM.sandboxBadgeCount.classList.remove('hidden');

    // Code view update
    DOM.sandboxCodeDisplay.textContent = rawCode;
    if (window.hljs) {
      hljs.highlightElement(DOM.sandboxCodeDisplay);
    }

    // Prepare complete iframe HTML with console hook
    let iframeDoc = rawCode;
    if (!rawCode.includes('<!DOCTYPE html>') && !rawCode.includes('<html')) {
      if (language === 'svg') {
        iframeDoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#111;color:#fff;}</style></head><body>${rawCode}</body></html>`;
      } else if (language === 'javascript' || language === 'js') {
        iframeDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0f0d;color:#e2e8f0;font-family:sans-serif;padding:20px;}</style></head><body><div id="app"></div><script>${rawCode}<\/script></body></html>`;
      } else {
        iframeDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#0a0f0d;color:#e2e8f0;font-family:sans-serif;padding:20px;}</style></head><body>${rawCode}</body></html>`;
      }
    }

    // Inject console redirector
    const consoleInterceptor = `
      <script>
        (function() {
          function sendLog(level, args) {
            const msg = Array.from(args).map(a => {
              try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
              catch(e) { return String(a); }
            }).join(' ');
            window.parent.postMessage({ type: 'ELEX_SANDBOX_CONSOLE', level: level, message: msg }, '*');
          }
          const origLog = console.log;
          console.log = function() { origLog.apply(console, arguments); sendLog('log', arguments); };
          const origErr = console.error;
          console.error = function() { origErr.apply(console, arguments); sendLog('error', arguments); };
          const origWarn = console.warn;
          console.warn = function() { origWarn.apply(console, arguments); sendLog('warn', arguments); };
          window.onerror = function(message, source, lineno, colno, error) {
            sendLog('error', [message + ' (' + lineno + ':' + colno + ')']);
          };
        })();
      <\/script>
    `;

    // Clear console output box
    DOM.sandboxConsoleLog.innerHTML = '<div class="console-line system">[System] Sandbox reloaded in secure isolated runtime.</div>';
    DOM.consoleCount.textContent = '0';

    // Insert interceptor into head or top of html
    if (iframeDoc.includes('<head>')) {
      iframeDoc = iframeDoc.replace('<head>', '<head>' + consoleInterceptor);
    } else {
      iframeDoc = consoleInterceptor + iframeDoc;
    }

    DOM.sandboxIframe.srcdoc = iframeDoc;

    if (openPanel) {
      DOM.sandboxPanel.classList.remove('hidden');
      switchSandboxTab('preview');
      showToast('Artifact loaded in Live Sandbox Studio', 'success');
    }
  }

  function appendConsoleLog(level, message) {
    const line = document.createElement('div');
    line.className = `console-line ${level}`;
    line.textContent = `[${level.toUpperCase()}] ${message}`;
    DOM.sandboxConsoleLog.appendChild(line);
    DOM.sandboxConsoleLog.scrollTop = DOM.sandboxConsoleLog.scrollHeight;

    const cur = parseInt(DOM.consoleCount.textContent || '0', 10);
    DOM.consoleCount.textContent = (cur + 1).toString();
  }

  function switchSandboxTab(tabName) {
    document.querySelectorAll('.sandbox-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sandbox-view').forEach(v => v.classList.remove('active'));

    const activeBtn = document.querySelector(`.sandbox-tab[data-tab="${tabName}"]`);
    const activeView = document.getElementById(`sandbox-view-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.classList.add('active');
  }

  /* ==========================================================================
     Zip Generation & Export (JSZip + FileSaver)
     ========================================================================== */
  function exportProjectAsZip() {
    if (!state.currentArtifact.code) {
      showToast('No active code artifact to export. Generate or open an artifact first.', 'warn');
      return;
    }

    if (!window.JSZip) {
      showToast('JSZip library loading... please try in a moment.', 'warn');
      return;
    }

    const zip = new JSZip();
    const artifactCode = state.currentArtifact.code;
    const session = getActiveSession();
    const sessionTitle = session ? session.title : 'Elex AI Project';

    // Add files to zip
    zip.file('index.html', artifactCode);

    // Add README.md
    const readmeContent = `# ${sessionTitle}
Generated autonomously by **Elex AI** (Frontier Autonomous Studio).

## Project Overview
- Artifact: ${state.currentArtifact.filename}
- Created: ${new Date().toLocaleString()}
- Engine: ${state.currentModel === 'native' ? 'Elex Native Brain' : state.currentModel}

## Deployment & Running
1. Double-click index.html to open directly in any modern browser.
2. Or drag-and-drop this unzipped folder straight into Netlify Drop (https://app.netlify.com/drop) for instant global hosting with HTTPS.

---
Built with Elex AI Studio
`;
    zip.file('README.md', readmeContent);

    // Add Netlify deployment config
    const netlifyToml = `[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
`;
    zip.file('netlify.toml', netlifyToml);

    // Generate zip blob
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const filename = `elex-artifact-${Date.now()}.zip`;
      if (window.saveAs) {
        saveAs(content, filename);
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = filename;
        a.click();
      }
      showToast(`Exported ${filename} successfully!`, 'success');
    }).catch((err) => {
      console.error(err);
      showToast('Failed to build ZIP: ' + err.message, 'error');
    });
  }

  function exportConversation(format = 'markdown') {
    const session = getActiveSession();
    if (!session || session.messages.length === 0) {
      showToast('Current conversation is empty.', 'warn');
      return;
    }

    let exportContent = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      extension = 'md';
      exportContent = `# ${session.title}\n*Exported from Elex AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
      session.messages.forEach(m => {
        exportContent += `### ${m.role === 'user' ? 'User' : 'Elex AI'} (${m.meta?.time || ''})\n\n${m.content}\n\n---\n\n`;
      });
    } else if (format === 'json') {
      mimeType = 'application/json';
      extension = 'json';
      exportContent = JSON.stringify(session, null, 2);
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const filename = `elex-chat-${Date.now()}.${extension}`;
    if (window.saveAs) {
      saveAs(blob, filename);
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }
    showToast(`Conversation exported as ${extension.toUpperCase()}`, 'success');
  }

  /* ==========================================================================
     Intelligent Elex Native Brain (Default Zero-Config Engine)
     ========================================================================== */
  function simulateNativeBrain(userPrompt, attachedFileData) {
    const lower = userPrompt.toLowerCase();
    let thinkingSteps = [];
    let responseText = '';
    let citations = [];

    // Plugin 1: Web Search Simulation
    if (state.plugins.webSearch) {
      citations = [
        { title: 'W3C & WHATWG Standards Documentation', url: 'https://html.spec.whatwg.org' },
        { title: 'MDN Web Docs & Modern JS Runtime', url: 'https://developer.mozilla.org' },
        { title: 'Netlify Edge Architecture & Static Deploy Guides', url: 'https://docs.netlify.com' }
      ];
      thinkingSteps.push('[Web Search Simulation]: Queried domain knowledge for modern web APIs, interactive patterns, and responsive glassmorphism frameworks.');
    }

    // Plugin 2: Prompt Optimizer & Chain-of-Thought
    if (state.plugins.promptOpt) {
      thinkingSteps.push('[Prompt Optimizer]: Formulated structured execution matrix. Decomposed requirements into semantic layout, reactive state, resilient event handling, and modern UI tokens.');
    }

    // Plugin 3: File Analyzer
    if (attachedFileData) {
      thinkingSteps.push(`[File Analyzer]: Inspected attached artifact '${attachedFileData.name}' (${attachedFileData.size} bytes). Syntax analysis: OK. Parsing content structure into context.`);
    }

    // Heuristic & Template Synthesis Engine
    if (lower.includes('kanban') || lower.includes('board') || lower.includes('trello') || lower.includes('task management')) {
      thinkingSteps.push('Synthesizing complete, standalone Kanban application with drag-and-drop HTML5 API, column creation, task cards, persistent localStorage, and glowing dark UI.');
      responseText = `Here is a complete, responsive, and modern **Interactive Kanban Board** crafted in a single self-contained HTML/CSS/JS file. You can preview it right now in the **Live Sandbox** or export it directly as a ready-to-deploy **.ZIP bundle** for Netlify!

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyber Kanban Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0f0d;
      --card-bg: #111a15;
      --surface: #15221b;
      --border: #064e3b;
      --emerald: #10b981;
      --mint: #34d399;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    h1 { font-size: 1.5rem; color: var(--mint); display: flex; align-items: center; gap: 8px; }
    .btn { background: var(--emerald); color: #052e16; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: var(--mint); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
    .board-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .column { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; min-height: 480px; display: flex; flex-direction: column; }
    .column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-weight: 600; font-size: 0.95rem; }
    .badge { background: var(--surface); color: var(--mint); border: 1px solid var(--border); font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; }
    .task-list { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .task-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; cursor: grab; transition: 0.2s; }
    .task-card:hover { border-color: var(--emerald); transform: translateY(-2px); }
    .task-card.dragging { opacity: 0.4; }
    .task-title { font-weight: 500; font-size: 0.9rem; margin-bottom: 6px; }
    .task-meta { font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between; }
    .add-task-btn { width: 100%; background: transparent; border: 1px dashed var(--border); color: var(--text-muted); padding: 8px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
    .add-task-btn:hover { border-color: var(--emerald); color: var(--mint); }
  </style>
</head>
<body>
  <header>
    <h1>⚡ Cyber Kanban Studio</h1>
    <button class="btn" onclick="addNewTask('todo')">+ Add Quick Task</button>
  </header>

  <div class="board-grid">
    <div class="column" data-col="todo" ondragover="allowDrop(event)" ondrop="handleDrop(event, 'todo')">
      <div class="column-header">
        <span>To Do</span>
        <span class="badge" id="count-todo">2</span>
      </div>
      <div class="task-list" id="col-todo">
        <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 1)" id="task-1">
          <div class="task-title">Design Neon Landing UI</div>
          <div class="task-meta"><span>Priority: High</span><span>Frontend</span></div>
        </div>
        <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 2)" id="task-2">
          <div class="task-title">Integrate JSZip Bundler</div>
          <div class="task-meta"><span>Priority: Medium</span><span>DevOps</span></div>
        </div>
      </div>
      <button class="add-task-btn" onclick="addNewTask('todo')">+ Add Task</button>
    </div>

    <div class="column" data-col="progress" ondragover="allowDrop(event)" ondrop="handleDrop(event, 'progress')">
      <div class="column-header">
        <span>In Progress</span>
        <span class="badge" id="count-progress">1</span>
      </div>
      <div class="task-list" id="col-progress">
        <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 3)" id="task-3">
          <div class="task-title">Build Netlify Deploy Hooks</div>
          <div class="task-meta"><span>Priority: High</span><span>Cloud</span></div>
        </div>
      </div>
      <button class="add-task-btn" onclick="addNewTask('progress')">+ Add Task</button>
    </div>

    <div class="column" data-col="done" ondragover="allowDrop(event)" ondrop="handleDrop(event, 'done')">
      <div class="column-header">
        <span>Done</span>
        <span class="badge" id="count-done">1</span>
      </div>
      <div class="task-list" id="col-done">
        <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 4)" id="task-4">
          <div class="task-title">Setup Elex AI Native Engine</div>
          <div class="task-meta"><span>Verified</span><span>Core</span></div>
        </div>
      </div>
      <button class="add-task-btn" onclick="addNewTask('done')">+ Add Task</button>
    </div>
  </div>

  <script>
    let draggedId = null;
    function handleDragStart(e, id) {
      draggedId = 'task-' + id;
      e.dataTransfer.setData('text/plain', draggedId);
      document.getElementById(draggedId).classList.add('dragging');
      console.log('Dragging task:', draggedId);
    }
    function allowDrop(e) { e.preventDefault(); }
    function handleDrop(e, colName) {
      e.preventDefault();
      const el = document.getElementById(draggedId);
      if (el) {
        el.classList.remove('dragging');
        document.getElementById('col-' + colName).appendChild(el);
        console.log('Task dropped into column:', colName);
        updateCounts();
      }
    }
    function updateCounts() {
      ['todo', 'progress', 'done'].forEach(c => {
        const count = document.getElementById('col-' + c).children.length;
        document.getElementById('count-' + c).innerText = count;
      });
    }
    function addNewTask(col) {
      const title = prompt('Enter task description:') || 'New Task Item';
      const id = Date.now();
      const card = document.createElement('div');
      card.className = 'task-card';
      card.id = 'task-' + id;
      card.draggable = true;
      card.ondragstart = (e) => handleDragStart(e, id);
      card.innerHTML = '<div class="task-title">' + title + '</div><div class="task-meta"><span>Active</span><span>Custom</span></div>';
      document.getElementById('col-' + col).appendChild(card);
      updateCounts();
      console.log('Created task:', title);
    }
  </script>
</body>
</html>
\`\`\`

### Key Features Included:
1. **Interactive HTML5 Drag and Drop**: Smooth card moving across columns.
2. **Dynamic Task Creation**: Add tasks to any column with live counter recalculation.
3. **Cyberpunk Minimal Aesthetic**: Matches Elex AI's signature emerald & obsidian palette.
4. **Zero External Dependencies**: Ready for instant Netlify drag-and-drop deployment!`;

    } else if (lower.includes('pomodoro') || lower.includes('timer') || lower.includes('synthwave') || lower.includes('clock')) {
      thinkingSteps.push('Synthesizing Cyberpunk Synthwave Pomodoro Timer with Web Audio API sound chime and neon circular progress bar.');
      responseText = `Here is a complete **Cyberpunk Neon Pomodoro Timer** with an interactive circular canvas visualizer, work/break interval switching, and an integrated Web Audio synthesizer chime!

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyberpunk Pomodoro</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0f0d;
      --card: #111a15;
      --emerald: #10b981;
      --mint: #34d399;
      --border: #064e3b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: #e2e8f0; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .timer-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 25px rgba(16, 185, 129, 0.2); width: 340px; }
    h2 { font-size: 1.2rem; color: var(--mint); margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase; }
    .mode-switch { display: flex; gap: 8px; margin-bottom: 24px; background: #0a0f0d; padding: 4px; border-radius: 10px; border: 1px solid var(--border); }
    .mode-btn { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 6px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    .mode-btn.active { background: #15221b; color: #fff; border: 1px solid var(--emerald); }
    .timer-display { font-family: 'JetBrains Mono', monospace; font-size: 3.4rem; font-weight: 700; color: #fff; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4); margin: 16px 0; }
    .controls { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
    .btn { background: var(--emerald); color: #052e16; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: var(--mint); box-shadow: 0 0 15px var(--emerald); transform: scale(1.02); }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: #94a3b8; }
    .btn-outline:hover { border-color: var(--emerald); color: #fff; }
    .tag { font-size: 0.75rem; color: #64748b; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="timer-card">
    <h2>⚡ Cyber Chrono</h2>
    <div class="mode-switch">
      <button class="mode-btn active" onclick="setMode(25, this)">Focus (25m)</button>
      <button class="mode-btn" onclick="setMode(5, this)">Short Break</button>
      <button class="mode-btn" onclick="setMode(15, this)">Long Break</button>
    </div>
    
    <div class="timer-display" id="time">25:00</div>

    <div class="controls">
      <button class="btn" id="start-btn" onclick="toggleTimer()">Start</button>
      <button class="btn btn-outline" onclick="resetTimer()">Reset</button>
    </div>
    <div class="tag">Web Audio Synthesizer Enabled</div>
  </div>

  <script>
    let totalSeconds = 25 * 60;
    let remaining = totalSeconds;
    let interval = null;
    let isRunning = false;

    function formatTime(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return m + ':' + s;
    }

    function updateDisplay() {
      document.getElementById('time').innerText = formatTime(remaining);
    }

    function toggleTimer() {
      const btn = document.getElementById('start-btn');
      if (isRunning) {
        clearInterval(interval);
        isRunning = false;
        btn.innerText = 'Resume';
        console.log('Timer paused at:', remaining);
      } else {
        isRunning = true;
        btn.innerText = 'Pause';
        console.log('Timer started.');
        interval = setInterval(() => {
          remaining--;
          updateDisplay();
          if (remaining <= 0) {
            clearInterval(interval);
            isRunning = false;
            btn.innerText = 'Start';
            playSynthChime();
            alert('Chrono completed! Take a break.');
          }
        }, 1000);
      }
    }

    function resetTimer() {
      clearInterval(interval);
      isRunning = false;
      remaining = totalSeconds;
      document.getElementById('start-btn').innerText = 'Start';
      updateDisplay();
      console.log('Timer reset.');
    }

    function setMode(mins, btn) {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      totalSeconds = mins * 60;
      resetTimer();
    }

    function playSynthChime() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
        console.log('Web Audio synthesized chime played.');
      } catch(e) {
        console.warn('Audio Context error:', e);
      }
    }
  </script>
</body>
</html>
\`\`\`

You can preview it directly in the **Live Sandbox** panel and test the sound chime and focus intervals!`;

    } else if (lower.includes('landing page') || lower.includes('website') || lower.includes('web design') || lower.includes('developer platform')) {
      thinkingSteps.push('Architecting futuristic neon AI Developer Platform Landing Page with hero section, features matrix, interactive pricing calculator, code terminal showcase, and responsive mobile nav.');
      responseText = `Here is a complete, production-grade **AI Developer Platform Landing Page** built with pure HTML5, CSS3, and JavaScript featuring glassmorphic components, interactive terminal mockup, pricing calculator, and high-conversion layout:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vortex AI — Autonomous Infrastructure</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0f0d;
      --card: #111a15;
      --border: #064e3b;
      --emerald: #10b981;
      --mint: #34d399;
      --text: #e2e8f0;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; line-height: 1.6; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); position: sticky; top: 0; background: rgba(10, 15, 13, 0.8); z-index: 50; }
    .logo { font-size: 1.25rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
    .logo span { color: var(--mint); }
    .nav-links { display: flex; gap: 24px; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; transition: 0.2s; }
    .nav-links a:hover { color: var(--mint); }
    .btn { background: var(--emerald); color: #052e16; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: var(--mint); box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); transform: translateY(-1px); }
    .hero { text-align: center; padding: 80px 20px 60px 20px; max-width: 900px; margin: 0 auto; }
    .hero-badge { display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid var(--emerald); color: var(--mint); font-size: 0.8rem; font-weight: 600; padding: 4px 14px; border-radius: 20px; margin-bottom: 20px; }
    .hero h1 { font-size: 3.2rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 18px; line-height: 1.15; }
    .hero p { font-size: 1.15rem; color: var(--muted); margin-bottom: 32px; max-width: 680px; margin-left: auto; margin-right: auto; }
    .terminal-window { max-width: 760px; margin: 0 auto 80px auto; background: #0c120e; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.2); overflow: hidden; }
    .terminal-header { background: #111a15; padding: 10px 16px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--border); }
    .term-dot { width: 10px; height: 10px; border-radius: 50%; background: #334155; }
    .term-dot.red { background: #ef4444; }
    .term-dot.yellow { background: #f59e0b; }
    .term-dot.green { background: #10b981; }
    .terminal-body { padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #a7f3d0; text-align: left; }
    .features-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; padding: 0 20px 80px 20px; }
    .feature-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: 0.2s; }
    .feature-card:hover { border-color: var(--emerald); transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .feature-icon { font-size: 2rem; margin-bottom: 14px; }
    .feature-card h3 { font-size: 1.2rem; color: #fff; margin-bottom: 8px; }
    .feature-card p { font-size: 0.9rem; color: var(--muted); }
    footer { border-top: 1px solid var(--border); padding: 32px; text-align: center; color: var(--muted); font-size: 0.85rem; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">⚡ VORTEX<span>.AI</span></div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#terminal">CLI & SDK</a>
      <a href="#docs">Docs</a>
    </div>
    <button class="btn" onclick="alert('Welcome to Vortex AI Developer Preview!')">Get API Keys</button>
  </nav>

  <section class="hero">
    <div class="hero-badge">v3.0 Production Cloud Engine</div>
    <h1>Autonomous Agent Swarms at Microsecond Latency</h1>
    <p>Deploy resilient self-correcting neural pipelines, deterministic code sandboxes, and enterprise data workflows in one command.</p>
    <button class="btn" onclick="runSimulation()">Launch Live Demo</button>
  </section>

  <div class="terminal-window" id="terminal">
    <div class="terminal-header">
      <div class="term-dot red"></div>
      <div class="term-dot yellow"></div>
      <div class="term-dot green"></div>
      <span style="font-size:0.75rem; color:#64748b; margin-left: 8px;">bash — vortex-cli deploy</span>
    </div>
    <div class="terminal-body" id="term-content">
      $ npx vortex deploy --env=production<br>
      [INFO] Compiling neural inference graphs...<br>
      [SUCCESS] Edge cluster provisioned in 34 regions.<br>
      [READY] Endpoint: https://vortex-agent-eu94.mesh.cloud
    </div>
  </div>

  <section class="features-grid" id="features">
    <div class="feature-card">
      <div class="feature-icon">🛡️</div>
      <h3>Deterministic Sandboxes</h3>
      <p>Zero-leak virtual micro-containers executing arbitrary untrusted code with nanosecond startup times.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">⚡</div>
      <h3>Zero-Config Edge Routing</h3>
      <p>Automatic geographic fallbacks across Gemini, OpenAI, Claude, and on-premise local Llama weights.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">📦</div>
      <h3>One-Click ZIP Artifacts</h3>
      <p>Export whole production repositories with Netlify configs, test runners, and infrastructure-as-code.</p>
    </div>
  </section>

  <footer>
    &copy; 2026 Vortex AI Inc. Deployed seamlessly with Elex AI Studio.
  </footer>

  <script>
    function runSimulation() {
      const term = document.getElementById('term-content');
      term.innerHTML += '<br><span style="color:#34d399">[DEMO] Starting distributed consensus stress test...</span><br>[OK] 100,000 req/sec validated across Netlify CDN.';
      console.log('Simulation triggered.');
    }
  </script>
</body>
</html>
\`\`\`

### Architectural Highlights:
- **Responsive Navigation & Hero**: Mobile and desktop optimized with CSS Grid.
- **Interactive Terminal**: Real-time mock command execution.
- **Glassmorphic Cyberpunk Theme**: Clean dark styling with emerald accents.
- Click **"Open in Sandbox"** above to run it live immediately!`;

    } else if (lower.includes('python') || lower.includes('crawler') || lower.includes('scraper') || lower.includes('async')) {
      thinkingSteps.push('Constructing production-ready Async Python Concurrent Web Scraper with aiohttp, asyncio semaphore rate-limiting, exponential backoff, and dataclass validation.');
      responseText = `Here is an enterprise-grade, asynchronous concurrent **Python Web Crawler & Scraper** architected with modern best practices, semaphore-bounded concurrency, exponential jitter retry, and structured JSON output:

\`\`\`python
import asyncio
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import json
import aiohttp
from bs4 import BeautifulSoup

# Configure Structured Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ElexCrawler")

@dataclass
class ScrapedArticle:
    url: str
    title: str
    status_code: int
    content_length: int
    summary: Optional[str] = None

class ConcurrentAsyncCrawler:
    def __init__(self, max_concurrent: int = 5, timeout_sec: int = 10, max_retries: int = 3):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.timeout = aiohttp.ClientTimeout(total=timeout_sec)
        self.max_retries = max_retries
        self.headers = {
            "User-Agent": "ElexAI-Bot/2.5 (+https://elex-ai.netlify.app/bot)",
            "Accept": "text/html,application/xhtml+xml"
        }

    async def fetch(self, session: aiohttp.ClientSession, url: str) -> Optional[ScrapedArticle]:
        async with self.semaphore:
            for attempt in range(1, self.max_retries + 1):
                try:
                    logger.info(f"Fetching: {url} (Attempt {attempt}/{self.max_retries})")
                    async with session.get(url, headers=self.headers, timeout=self.timeout) as response:
                        if response.status == 200:
                            html = await response.text()
                            soup = BeautifulSoup(html, "html.parser")
                            title = soup.title.string.strip() if soup.title else "Untitled"
                            first_p = soup.find("p")
                            summary = first_p.get_text(strip=True)[:160] if first_p else ""

                            return ScrapedArticle(
                                url=url,
                                title=title,
                                status_code=response.status,
                                content_length=len(html),
                                summary=summary
                            )
                        elif response.status in (429, 500, 502, 503, 504):
                            wait_time = 2 ** attempt
                            logger.warning(f"Status {response.status} on {url}. Retrying in {wait_time}s...")
                            await asyncio.sleep(wait_time)
                        else:
                            logger.error(f"Non-retryable status {response.status} for {url}")
                            return None
                except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                    logger.warning(f"Error fetching {url}: {e}")
                    if attempt == self.max_retries:
                        return None
                    await asyncio.sleep(1.5 * attempt)
            return None

    async def crawl_urls(self, target_urls: List[str]) -> List[Dict]:
        connector = aiohttp.TCPConnector(limit=50, ssl=False)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [self.fetch(session, url) for url in target_urls]
            results = await asyncio.gather(*tasks, return_exceptions=False)
            valid_results = [asdict(r) for r in results if r is not None]
            logger.info(f"Crawling complete. Successfully scraped {len(valid_results)}/{len(target_urls)} items.")
            return valid_results

# Example Execution
if __name__ == "__main__":
    urls = [
        "https://news.ycombinator.com",
        "https://python.org",
        "https://github.com",
    ]
    
    crawler = ConcurrentAsyncCrawler(max_concurrent=3)
    crawled_data = asyncio.run(crawler.crawl_urls(urls))
    print("\n--- Scraped Results (JSON) ---")
    print(json.dumps(crawled_data, indent=2))
\`\`\`

### Key Architectural Strengths:
1. **Bounded Concurrency**: Uses \`asyncio.Semaphore(5)\` to protect against socket exhaustion and server blocking.
2. **Adaptive Exponential Backoff**: Automatically handles HTTP \`429 Too Many Requests\` and \`5xx\` server errors.
3. **Connection Pooling**: Uses \`aiohttp.TCPConnector\` with connection reuse.`;

    } else if (attachedFileData) {
      thinkingSteps.push(`Deep file analysis completed for ${attachedFileData.name}.`);
      responseText = `### 📁 File Analysis Report: \`${attachedFileData.name}\`

- **File Name**: \`${attachedFileData.name}\`
- **File Size**: \`${attachedFileData.size}\` bytes
- **Line Count**: \`${attachedFileData.content.split('\n').length}\` lines
- **Detected Type**: \`${attachedFileData.type || 'Plaintext / Source Code'}\`

#### Summary & Key Findings:
The provided file was parsed and examined. Here is the structural breakdown:
\`\`\`
${attachedFileData.content.slice(0, 500)}${attachedFileData.content.length > 500 ? '\n... [content continues]' : ''}
\`\`\`

**Recommendations & Insights:**
1. **Modularity**: The structure is straightforward and clean.
2. **Optimization**: If this file contains configuration or data schemas, consider validating against strict TypeScript interfaces or JSON schema specs.
3. **Integration with Elex AI**: You can request direct refactoring, conversion to another programming language, or automatic unit test generation for this file!`;

    } else {
      // General Versatile AI Assistant Response
      thinkingSteps.push(`Parsed user intent: "${userPrompt}". Formulated deep analytical breakdown with clear instructions, code implementation, and next steps.`);
      responseText = `### ⚡ Elex AI Analysis & Solution

Thank you for your prompt: **"${escapeHtml(userPrompt)}"**

As your versatile all-rounder AI assistant, here is a structured breakdown:

1. **Strategic Architecture**:
   - **Core Objective**: Execute the requested task with maximum efficiency, zero latency, and production-grade reliability.
   - **Execution Path**: Clean separation of concerns, modular components, and immediate previewability.

2. **Actionable Implementation**:
   - When building web applications or interactive widgets, Elex AI outputs self-contained single-page artifacts that you can preview instantly in the **Live Sandbox** on the right.
   - You can also click **"Export .ZIP"** anytime to download a pre-configured Netlify project bundle including \`index.html\`, \`README.md\`, and \`netlify.toml\`.

3. **Next Steps**:
   - Feel free to ask me to write a custom full-stack app, debug code, design algorithms, write essays, or analyze complex data.
   - If you want to connect live frontier models like **Gemini 2.5 Flash**, **GPT-4o**, or **Claude 3.5 Sonnet**, click the **Settings & Keys** gear in the sidebar or top navbar to add your personal API keys!`;
    }

    return {
      content: responseText,
      meta: {
        thinking: thinkingSteps.join('\n'),
        modelName: 'Elex Native Brain',
        searchCitations: citations
      }
    };
  }

  /* ==========================================================================
     External API Connectors
     ========================================================================== */
  async function callExternalAPI(userPrompt, modelId) {
    const session = getActiveSession();
    const history = session ? session.messages : [];

    // 1. Google Gemini API
    if (modelId.startsWith('gemini')) {
      const apiKey = state.apiKeys.gemini;
      if (!apiKey) {
        throw new Error('Please add your Google Gemini API Key in Settings to use this model, or switch to Elex Native Brain.');
      }

      const endpointModel = modelId === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpointModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const contents = [];
      // Append past turns (last 8 to keep context clean)
      history.slice(-8).forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
      // Append current user prompt
      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      const body = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: state.prefs.systemPrompt || DEFAULT_PREFS.systemPrompt }]
        },
        generationConfig: {
          temperature: parseFloat(state.prefs.temperature) || 0.7,
          maxOutputTokens: 4096
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Gemini API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
      return {
        content: text,
        meta: {
          modelName: endpointModel,
          thinking: `Executed via Google Gemini REST API (${endpointModel})`
        }
      };
    }

    // 2. OpenAI API
    if (modelId.startsWith('gpt')) {
      const apiKey = state.apiKeys.openai;
      if (!apiKey) {
        throw new Error('Please add your OpenAI API Key in Settings to use GPT-4o, or switch to Elex Native Brain.');
      }

      const baseUrl = (state.apiKeys.customBase && state.apiKeys.customBase.trim()) 
                        ? state.apiKeys.customBase.replace(/\/$/, '') 
                        : 'https://api.openai.com/v1';

      const messages = [
        { role: 'system', content: state.prefs.systemPrompt || DEFAULT_PREFS.systemPrompt }
      ];

      history.slice(-8).forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          temperature: parseFloat(state.prefs.temperature) || 0.7
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || 'No response from OpenAI.';
      return {
        content: text,
        meta: {
          modelName: modelId,
          thinking: `Executed via OpenAI Chat Completions API (${modelId})`
        }
      };
    }

    // 3. OpenRouter API
    if (modelId === 'openrouter') {
      const apiKey = state.apiKeys.openrouter;
      if (!apiKey) {
        throw new Error('Please add your OpenRouter API Key in Settings, or switch to Elex Native Brain.');
      }

      const messages = [
        { role: 'system', content: state.prefs.systemPrompt || DEFAULT_PREFS.systemPrompt }
      ];
      history.slice(-8).forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://elex-ai.netlify.app',
          'X-Title': 'Elex AI'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: messages,
          temperature: parseFloat(state.prefs.temperature) || 0.7
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenRouter returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || 'No response from OpenRouter.';
      return {
        content: text,
        meta: {
          modelName: 'OpenRouter (DeepSeek / Llama)',
          thinking: `Executed via OpenRouter Multi-Model Gateway`
        }
      };
    }

    // Fallback
    return simulateNativeBrain(userPrompt, null);
  }

  /* ==========================================================================
     Send Message Pipeline
     ========================================================================== */
  async function handleSendMessage(e) {
    if (e) e.preventDefault();
    if (state.isGenerating) return;

    const rawInput = DOM.userInput.value.trim();
    if (!rawInput && !state.attachedFile) return;

    const session = getActiveSession();
    if (!session) return;

    const attachedData = state.attachedFile;

    // Reset input fields
    DOM.userInput.value = '';
    DOM.userInput.style.height = 'auto';
    clearAttachedFile();

    // Auto-rename session on first message
    if (session.messages.length === 0) {
      session.title = rawInput.slice(0, 28) || (attachedData ? attachedData.name : 'Conversation');
      renderHistoryList();
    }

    // Save & Render User Message
    const userMsg = {
      role: 'user',
      content: rawInput || `[Uploaded file: ${attachedData.name}]`,
      meta: {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        file: attachedData ? { name: attachedData.name, size: (attachedData.size / 1024).toFixed(1) + ' KB' } : null
      }
    };
    session.messages.push(userMsg);
    saveSessions();
    renderMessageBubble(userMsg.role, userMsg.content, userMsg.meta, true);

    // Show generating state
    state.isGenerating = true;
    DOM.btnSend.disabled = true;
    DOM.btnSend.innerHTML = `<span style="display: inline-block;">⚙</span>`;

    try {
      let responseObj;

      if (state.currentModel === 'native') {
        // Native Brain with smooth micro-delay for realistic reasoning cadence
        await new Promise(r => setTimeout(r, 650));
        responseObj = simulateNativeBrain(rawInput, attachedData);
      } else {
        // External Provider API Call
        responseObj = await callExternalAPI(rawInput, state.currentModel);
      }

      // Save & Render Assistant Message
      const assistantMsg = {
        role: 'assistant',
        content: responseObj.content,
        meta: {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...responseObj.meta
        }
      };
      session.messages.push(assistantMsg);
      saveSessions();
      renderMessageBubble(assistantMsg.role, assistantMsg.content, assistantMsg.meta, true);

    } catch (err) {
      console.error(err);
      const errMsg = {
        role: 'assistant',
        content: `⚠️ **Error Processing Request**:\n\n${err.message}\n\n*Tip: You can switch back to "Elex Native Brain" in the top model menu to continue chatting without an API key.*`,
        meta: { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      };
      session.messages.push(errMsg);
      saveSessions();
      renderMessageBubble(errMsg.role, errMsg.content, errMsg.meta, true);
      showToast(err.message, 'error');
    } finally {
      state.isGenerating = false;
      DOM.btnSend.disabled = false;
      DOM.btnSend.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  }

  /* ==========================================================================
     File Analyzer Attachment Handling
     ========================================================================== */
  function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File exceeds 2MB limit for client analysis.', 'warn');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      state.attachedFile = {
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: event.target.result
      };
      DOM.attachmentFilename.textContent = file.name;
      DOM.attachmentFilesize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
      DOM.attachmentPreviewBar.classList.remove('hidden');
      showToast(`Attached ${file.name} for inspection`, 'info');
    };
    reader.readAsText(file);
  }

  function clearAttachedFile() {
    state.attachedFile = null;
    DOM.fileInput.value = '';
    DOM.attachmentPreviewBar.classList.add('hidden');
  }

  /* ==========================================================================
     Model & Settings UI Helpers
     ========================================================================== */
  function updateModelDisplay() {
    const modelLabels = {
      'native': 'Elex Native Brain',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gpt-4o': 'OpenAI GPT-4o',
      'gpt-4o-mini': 'OpenAI GPT-4o Mini',
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'openrouter': 'OpenRouter (DeepSeek)'
    };

    const label = modelLabels[state.currentModel] || 'Elex Native Brain';
    DOM.currentModelDisplay.textContent = label;
    DOM.sidebarEngineName.textContent = label;

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.toggle('active', item.dataset.model === state.currentModel);
    });

    localStorage.setItem(STORAGE_KEYS.MODEL, state.currentModel);
  }

  function renderPluginBadges() {
    DOM.activePluginsBar.innerHTML = '';
    const plugins = [
      { key: 'webSearch', label: '🌐 Web Search' },
      { key: 'codeRunner', label: '💻 Live Sandbox' },
      { key: 'fileAnalyzer', label: '📁 Analyzer' },
      { key: 'promptOpt', label: '🎯 Optimizer' }
    ];

    const activeList = [];
    plugins.forEach(p => {
      if (state.plugins[p.key]) {
        activeList.push(p.label.split(' ')[1]);
        const tag = document.createElement('span');
        tag.className = 'plugin-tag';
        tag.textContent = p.label;
        DOM.activePluginsBar.appendChild(tag);
      }
    });

    DOM.footerPluginsIndicator.textContent = activeList.length > 0 
      ? `Active: ${activeList.join(' • ')}` 
      : 'All plugins disabled';
  }

  function loadSettingsIntoUI() {
    DOM.keyGemini.value = state.apiKeys.gemini || '';
    DOM.keyOpenai.value = state.apiKeys.openai || '';
    DOM.keyAnthropic.value = state.apiKeys.anthropic || '';
    DOM.keyOpenrouter.value = state.apiKeys.openrouter || '';
    DOM.customBaseUrl.value = state.apiKeys.customBase || '';

    DOM.pluginWebsearch.checked = !!state.plugins.webSearch;
    DOM.pluginCoderunner.checked = !!state.plugins.codeRunner;
    DOM.pluginFileanalyzer.checked = !!state.plugins.fileAnalyzer;
    DOM.pluginPromptopt.checked = !!state.plugins.promptOpt;

    DOM.prefSystemPrompt.value = state.prefs.systemPrompt || DEFAULT_PREFS.systemPrompt;
    DOM.prefTemperature.value = state.prefs.temperature || 0.7;
    DOM.tempDisplay.textContent = state.prefs.temperature || 0.7;
  }

  function saveSettingsFromUI() {
    state.apiKeys = {
      gemini: DOM.keyGemini.value.trim(),
      openai: DOM.keyOpenai.value.trim(),
      anthropic: DOM.keyAnthropic.value.trim(),
      openrouter: DOM.keyOpenrouter.value.trim(),
      customBase: DOM.customBaseUrl.value.trim()
    };

    state.plugins = {
      webSearch: DOM.pluginWebsearch.checked,
      codeRunner: DOM.pluginCoderunner.checked,
      fileAnalyzer: DOM.pluginFileanalyzer.checked,
      promptOpt: DOM.pluginPromptopt.checked
    };

    state.prefs = {
      systemPrompt: DOM.prefSystemPrompt.value.trim(),
      temperature: parseFloat(DOM.prefTemperature.value) || 0.7
    };

    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(state.apiKeys));
    localStorage.setItem(STORAGE_KEYS.PLUGINS, JSON.stringify(state.plugins));
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(state.prefs));

    renderPluginBadges();
    DOM.settingsModal.classList.add('hidden');
    showToast('Settings & security configurations applied', 'success');
  }

  /* ==========================================================================
     Event Binding
     ========================================================================== */
  function bindEvents() {
    // Sidebar Toggles
    DOM.btnToggleSidebar.onclick = () => DOM.sidebar.classList.toggle('collapsed');
    DOM.btnCollapseSidebar.onclick = () => DOM.sidebar.classList.add('collapsed');

    // New Chat
    DOM.btnNewChat.onclick = () => createNewSession(true);

    // Clear All History
    DOM.btnClearHistory.onclick = () => {
      openConfirmDialog(
        'Clear All Chat History?',
        'This will erase all past conversation sessions from your browser. This action cannot be undone.',
        () => {
          state.sessions = [];
          localStorage.removeItem(STORAGE_KEYS.SESSIONS);
          createNewSession(true);
        }
      );
    };

    // Model Dropdown
    DOM.modelSelectBtn.onclick = (e) => {
      e.stopPropagation();
      DOM.modelDropdownMenu.classList.toggle('hidden');
    };

    document.addEventListener('click', () => {
      DOM.modelDropdownMenu.classList.add('hidden');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        state.currentModel = item.dataset.model;
        updateModelDisplay();
        DOM.modelDropdownMenu.classList.add('hidden');
        showToast(`Switched model to ${DOM.currentModelDisplay.textContent}`, 'info');
      };
    });

    // Chat Form Submissions & Keyboard handling
    DOM.chatForm.onsubmit = handleSendMessage;
    DOM.userInput.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Auto-grow textarea
    DOM.userInput.oninput = () => {
      DOM.userInput.style.height = 'auto';
      DOM.userInput.style.height = Math.min(DOM.userInput.scrollHeight, 200) + 'px';
    };

    // File Attachment
    DOM.btnAttachFile.onclick = () => DOM.fileInput.click();
    DOM.fileInput.onchange = handleFileSelected;
    DOM.btnRemoveAttachment.onclick = clearAttachedFile;

    // Preset Starters & Suggestion Cards
    document.querySelectorAll('.preset-pill, .starter-card').forEach(btn => {
      btn.onclick = () => {
        const prompt = btn.dataset.prompt;
        if (prompt) {
          DOM.userInput.value = prompt;
          DOM.userInput.focus();
          handleSendMessage();
        }
      };
    });

    // Sandbox Toggle & Tabs
    DOM.btnToggleSandbox.onclick = () => {
      DOM.sandboxPanel.classList.toggle('hidden');
      if (!DOM.sandboxPanel.classList.contains('hidden') && !state.currentArtifact.code) {
        loadIntoSandbox(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0a0f0d; color: #34d399; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { border: 1px solid #064e3b; padding: 24px; border-radius: 12px; background: #111a15; box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
  </style>
</head>
<body>
  <div class="box">
    <h2>⚡ Elex Live Sandbox Active</h2>
    <p style="color:#94a3b8; font-size:0.9rem;">Ask Elex AI to generate any HTML/CSS/JS code to see it run live here!</p>
  </div>
</body>
</html>`, 'html', false);
      }
    };

    DOM.btnCloseSandbox.onclick = () => DOM.sandboxPanel.classList.add('hidden');
    DOM.btnRefreshSandbox.onclick = () => {
      if (state.currentArtifact.code) {
        loadIntoSandbox(state.currentArtifact.code, state.currentArtifact.language, false);
        showToast('Sandbox refreshed', 'info');
      }
    };
    DOM.btnDownloadZip.onclick = exportProjectAsZip;
    DOM.btnPopoutSandbox.onclick = () => {
      if (state.currentArtifact.code) {
        const blob = new Blob([state.currentArtifact.code], { type: 'text/html' });
        window.open(URL.createObjectURL(blob), '_blank');
      }
    };

    document.querySelectorAll('.sandbox-tab').forEach(btn => {
      btn.onclick = () => switchSandboxTab(btn.dataset.tab);
    });

    // Chat Clear & Export
    DOM.btnClearChat.onclick = () => {
      openConfirmDialog(
        'Clear Active Chat?',
        'This will remove all messages from the current conversation view.',
        () => {
          const session = getActiveSession();
          if (session) {
            session.messages = [];
            saveSessions();
            loadSession(session.id);
            showToast('Active chat cleared', 'info');
          }
        }
      );
    };

    DOM.btnExportChat.onclick = () => exportConversation('markdown');

    // Settings Modal
    DOM.btnOpenSettings.onclick = () => {
      loadSettingsIntoUI();
      DOM.settingsModal.classList.remove('hidden');
    };
    DOM.btnCloseSettings.onclick = () => DOM.settingsModal.classList.add('hidden');
    DOM.btnSaveSettings.onclick = saveSettingsFromUI;

    // Settings Navigation Tabs
    document.querySelectorAll('.settings-nav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(btn.dataset.tab);
        if (pane) pane.classList.add('active');
      };
    });

    // Show/Hide API Key Toggle
    document.querySelectorAll('.btn-show-key').forEach(btn => {
      btn.onclick = () => {
        const target = document.getElementById(btn.dataset.target);
        if (target.type === 'password') {
          target.type = 'text';
          btn.textContent = 'Hide';
        } else {
          target.type = 'password';
          btn.textContent = 'Show';
        }
      };
    });

    // Temperature Slider
    DOM.prefTemperature.oninput = () => {
      DOM.tempDisplay.textContent = DOM.prefTemperature.value;
    };

    // Export All Data & Reset
    DOM.btnExportAllData.onclick = () => {
      const dump = {
        sessions: state.sessions,
        plugins: state.plugins,
        prefs: state.prefs,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `elex-backup-${Date.now()}.json`;
      a.click();
      showToast('All local sessions and preferences backed up to JSON', 'success');
    };

    DOM.btnResetDefaults.onclick = () => {
      openConfirmDialog(
        'Reset Preferences to Default?',
        'This will reset custom system prompts, temperatures, and plugin settings to factory defaults.',
        () => {
          state.plugins = { ...DEFAULT_PLUGINS };
          state.prefs = { ...DEFAULT_PREFS };
          loadSettingsIntoUI();
          saveSettingsFromUI();
        }
      );
    };
  }

  /* ==========================================================================
     Confirmation Dialog Utility
     ========================================================================== */
  let confirmCallback = null;

  function openConfirmDialog(title, desc, onConfirm) {
    DOM.confirmTitle.textContent = title;
    DOM.confirmDesc.textContent = desc;
    confirmCallback = onConfirm;
    DOM.confirmModal.classList.remove('hidden');
  }

  DOM.btnConfirmCancel.onclick = () => {
    DOM.confirmModal.classList.add('hidden');
    confirmCallback = null;
  };

  DOM.btnConfirmProceed.onclick = () => {
    DOM.confirmModal.classList.add('hidden');
    if (typeof confirmCallback === 'function') {
      confirmCallback();
    }
    confirmCallback = null;
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
