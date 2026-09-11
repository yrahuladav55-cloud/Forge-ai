# Elex AI — Frontier Autonomous Multi-Model Intelligence & Artifact Studio

[![Netlify Status](https://img.shields.io/badge/Netlify-Ready-10b981?style=flat&logo=netlify)](https://app.netlify.com/drop)
[![Engine](https://img.shields.io/badge/Engine-Zero--Config%20Native%20Brain-34d399?style=flat)](https://elex-ai.netlify.app)
[![Architecture](https://img.shields.io/badge/Stack-HTML5%20%2F%20CSS3%20%2F%20ES6%2B-064e3b?style=flat)]()

**Elex AI** is a futuristic, ultra-fast, responsive single-page web application designed for coding, writing, problem-solving, UI design, and autonomous project generation. It combines an instant **zero-config client-side brain** with bring-your-own-key multi-model access (**Google Gemini**, **OpenAI GPT-4o**, **Claude 3.5 Sonnet**, and **OpenRouter**).

---

## ⚡ Key Capabilities

### 1. Default Zero-Config Frontier Brain
- **Instant Usability**: No account, API keys, or backend setup required to chat immediately.
- **Intelligent Synthesis**: High-caliber code generation (Kanban boards, timers, landing pages, audio synthesizers, Python async scrapers), structured reasoning, and problem-solving.
- **Reasoning Protocol**: Real-time Chain-of-Thought thinking drawer demonstrating heuristic decomposition.

### 2. Live Artifacts & Sandbox Runner Studio
- **Integrated Iframe Sandbox**: Code blocks (HTML, SVG, JavaScript, CSS) can be launched directly into an isolated interactive runner window.
- **Virtual Console Capture**: Intercepts `console.log`, `console.warn`, and `console.error` from inside the sandbox and renders them in an in-browser terminal inspector.
- **Client-Side Project ZIP Bundler**: Uses `JSZip` and `FileSaver` to package full multi-file web applications into a `.zip` archive on the fly directly inside the user's browser.

### 3. Bring-Your-Own-Key Multi-Model Mode
- Intuitive modal drawer supporting direct provider endpoints:
  - **Google Gemini**: Gemini 2.5 Flash, Gemini 1.5 Pro
  - **OpenAI**: GPT-4o, GPT-4o-mini
  - **Anthropic**: Claude 3.5 Sonnet
  - **OpenRouter**: DeepSeek-R1, DeepSeek-V3, Llama 3.3 70B, Mistral Large
  - **Custom Base URL**: Compatible with local Ollama or private proxies
- **Zero Server-Side Logging**: All keys are stored client-side in the browser's `localStorage` and sent directly to provider APIs.

### 4. Modular Plugin Architecture
- **🌐 Web Search Simulation**: Adds real-time simulated web intelligence with reference links and citations.
- **💻 Live Code Runner & Sandbox**: Auto-detects runnable code and displays interactive preview triggers.
- **📁 File Analyzer & Inspector**: Drag-and-drop or attach `.txt`, `.json`, `.csv`, `.js`, `.py`, `.html`, `.css`, or `.md` files for instant audits, linting, and structural reviews.
- **🎯 Prompt Optimizer**: Enriches queries with reasoning scaffolds and persona boundaries.

### 5. Cyberpunk Neon-Emerald Theme & UX
- Deep dark canvas (`#0a0f0d`, `#111a15`) accented with emerald (`#10b981`), mint (`#34d399`), and soft forest borders (`#064e3b`).
- Glassmorphism panels, glowing indicator orbs, micro-interactions, and responsive layout (split screen on desktop, slide-over drawer on mobile).

---

## 🚀 Instant Deployment to Netlify

This project is a standalone, zero-dependency static build ready for immediate deployment:

### Option A: Drag-and-Drop via Netlify Drop (Fastest — 30 Seconds)
1. Download or clone this folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the `elex-ai` folder into the Netlify upload target.
4. Netlify immediately provisions your global CDN site with automatic HTTPS!

### Option B: Git & Netlify CLI
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit of Elex AI"

# Deploy via Netlify CLI
netlify deploy --prod --dir=.
```

---

## 🛠 File Structure

```
elex-ai/
├── index.html        # Semantic HTML5 single-page structure & modal layouts
├── styles.css        # Futuristic neon-emerald dark theme & glassmorphism
├── app.js            # Reactive state, Native Brain, Multi-API connectors, JSZip bundler
├── netlify.toml      # Netlify edge security headers and SPA redirects
└── README.md         # Comprehensive documentation
```

---

## 🔒 Security & Privacy
- **Client-Side Keys**: API keys never touch any intermediary server.
- **Isolated Sandbox**: Sandboxed iframe executes untrusted code with restricted permissions.
- **Zero Telemetry**: No third-party analytics or tracker scripts.

---
© 2026 Elex AI Studio. All rights reserved.
