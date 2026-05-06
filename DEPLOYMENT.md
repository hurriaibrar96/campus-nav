# Deployment Guide

## 📂 Project Structure (Updated)

```
campus-ar-navigation-system/
├── ar_vr_module/          ❌ NOT deployed (future AR/VR features)
├── backend/               ✅ Deployed to Render (ALL-IN-ONE)
│   ├── app/
│   │   └── services/
│   │       ├── intent_fallback.json  ✅ Chatbot intents
│   │       └── navigation_service.py
│   ├── data/              ✅ Campus map data
│   │   └── campus_map.json
│   ├── docs/              ✅ API documentation
│   ├── scripts/           ✅ Utility scripts
│   │   ├── generate_qr.py
│   │   └── sync_data.bat
│   └── requirements.txt
├── frontend/              ✅ Deployed to Vercel
└── render.yaml            (Render deployment config)
```

## ✅ Benefits of New Structure

1. **Everything backend needs is in one folder** - No more path issues!
2. **Simpler deployment** - Render deploys `backend/` with all dependencies
3. **No file syncing needed** - Edit `backend/data/campus_map.json` directly
4. **Cleaner organization** - Related files stay together

---

## 🚀 What Gets Deployed Where

### **Backend → Render**
**Deployed folder:** `backend/`

**Includes:**
- ✅ `backend/app/` - All Python code
- ✅ `backend/data/campus_map.json` - Campus map data
- ✅ `backend/app/services/intent_fallback.json` - Chatbot intents
- ✅ `backend/docs/` - API documentation
- ✅ `backend/scripts/` - Utility scripts
- ✅ `backend/requirements.txt` - Python dependencies

**Excludes:**
- ❌ `ar_vr_module/` (outside backend/)
- ❌ `frontend/` (deployed separately)

**Render Configuration (`render.yaml`):**
```yaml
services:
  - type: web
    name: campus-ar-backend
    runtime: python
    rootDir: backend          # Deploys entire backend folder
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

### **Frontend → Vercel**
**Deployed folder:** `frontend/`

**Includes:**
- ✅ `frontend/src/` - React components
- ✅ `frontend/public/` - Static assets
- ✅ `frontend/package.json` - Dependencies
- ✅ `frontend/vite.config.js` - Build config

**Excludes:**
- ❌ Everything outside `frontend/`

**Vercel Configuration (`frontend/vercel.json`):**
```json
{
  "buildCommand": "npx vite build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 🔧 How Data Files Are Handled

### **campus_map.json**
- **Location:** `backend/data/campus_map.json`
- **Status:** ✅ Inside backend folder, deploys automatically
- **Path in code:** `backend/app/services/navigation_service.py` uses `../../data/campus_map.json`

### **intent_fallback.json**
- **Location:** `backend/app/services/intent_fallback.json`
- **Status:** ✅ Inside backend folder, deploys automatically

---

## 📝 Deployment Workflow

### **When You Update campus_map.json:**

1. Edit `backend/data/campus_map.json` directly
2. Commit and push:
   ```bash
   git add backend/data/campus_map.json
   git commit -m "update: campus map layout"
   git push
   ```
3. Render auto-deploys backend with new map

### **When You Update Frontend:**

1. Edit files in `frontend/src/`
2. Commit and push:
   ```bash
   git add frontend/
   git commit -m "feat: new feature"
   git push
   ```
3. Vercel auto-deploys frontend

### **When You Update Backend Code:**

1. Edit files in `backend/app/`
2. Commit and push:
   ```bash
   git add backend/
   git commit -m "fix: backend improvement"
   git push
   ```
3. Render auto-deploys backend

---

## 🗂️ Folders Inside Backend (All Deployed)

### **backend/data/**
- **Purpose:** Campus map and other data files
- **Status:** ✅ Deployed with backend
- **Files:** `campus_map.json`

### **backend/docs/**
- **Purpose:** API documentation
- **Status:** ✅ Deployed (accessible if needed)
- **Files:** `api_docs.md`, `architecture.md`

### **backend/scripts/**
- **Purpose:** Utility scripts
- **Status:** ✅ Deployed (can be run on server if needed)
- **Files:** `generate_qr.py`, `sync_data.bat`

---

## ✅ Deployment Checklist

Before pushing to production:

- [ ] Update `backend/data/campus_map.json` if map changed
- [ ] Update `backend/app/services/intent_fallback.json` if chatbot changed
- [ ] Test backend locally: `cd backend && uvicorn app.main:app --reload`
- [ ] Test frontend locally: `cd frontend && npm run dev`
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Verify Render deployment (check logs)
- [ ] Verify Vercel deployment (check preview URL)
- [ ] Test production URLs

---

## 🔗 Deployment URLs

**Backend (Render):**
- Production: `https://campus-ar-backend.onrender.com`
- API Docs: `https://campus-ar-backend.onrender.com/docs`

**Frontend (Vercel):**
- Production: `https://your-app.vercel.app`
- Preview: Auto-generated for each commit

---

## 🐛 Common Issues

### Issue: Backend can't find campus_map.json
**Solution:** Make sure `backend/data/campus_map.json` exists and is committed

### Issue: Frontend can't connect to backend
**Solution:** Check `frontend/.env` has correct `VITE_API_URL`

### Issue: Changes not reflected after push
**Solution:** Check deployment logs on Render/Vercel for errors
