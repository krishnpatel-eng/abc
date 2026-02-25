# ⚡ Pabbly Copilot — AI Workflow Builder

Build Pabbly Connect workflows with plain English. Supports 2000+ apps.

---

## 🚀 HOW TO DEPLOY (Step by Step — No Coding Needed)

### STEP 1 — Get Your Free Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up for a free account
3. Click "API Keys" in the left menu
4. Click "Create Key" → Copy the key (starts with `sk-ant-...`)

### STEP 2 — Add Your API Key
1. Open the file: `src/App.js`
2. Find line 8: `const ANTHROPIC_API_KEY = "YOUR_API_KEY_HERE";`
3. Replace `YOUR_API_KEY_HERE` with your actual key
4. Save the file

### STEP 3 — Deploy to Vercel (Free Hosting)
1. Go to https://github.com and create a free account
2. Create a new repository called "pabbly-copilot"
3. Upload ALL these files to GitHub (drag and drop)
4. Go to https://vercel.com → Sign up with GitHub
5. Click "New Project" → Import your GitHub repo
6. Click "Deploy" — done in 2 minutes!
7. Vercel gives you a FREE link like: `pabbly-copilot.vercel.app`

---

## 📁 Files in this Project
```
pabbly-copilot/
├── public/
│   └── index.html
├── src/
│   ├── App.js        ← ADD YOUR API KEY HERE
│   └── index.js
├── package.json
└── README.md
```

---

## 💡 Features
- ✅ 2000+ Pabbly Connect apps supported
- ✅ Plain English → Complete workflow
- ✅ Step-by-step Pabbly setup instructions
- ✅ Export workflows as text files
- ✅ Conversation memory (follow-up questions work)
- ✅ Mobile friendly

---

## ❓ Troubleshooting
- **"Failed to fetch"** → Make sure you added your API key in src/App.js
- **API key not working** → Get a new one from console.anthropic.com
- **Page not loading** → Clear browser cache and refresh
