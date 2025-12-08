# 🚀 Relay Network - Quick Start Guide

**Consolidated startup and configuration documentation**

---

## ⚡ **START THE SYSTEM**

### **Step-by-Step (Recommended)**
```bash
# Terminal 1: Start backend
npm run dev:backend
# Wait for "Server started successfully" message

# Terminal 2: Start frontend
npm run dev:frontend
```

### **Alternative: All Services at Once**
```bash
npm run services:all
```

---

## 🖥️ **ACCESS THE SYSTEM**

### **Local Development**
- **Main Application:** http://localhost:5175
- **Backend API:** http://localhost:3002
- **Health Check:** http://localhost:3002/health

### **Network Access (Mobile/Other Devices)**
Replace `localhost` with your computer's IP address:
- **Find your IP:** `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- **Mobile Access:** `http://[YOUR_IP]:5175`
- **Example:** `http://192.168.1.100:5175`

---

## 🛠️ **CONFIGURATION**

### **Environment Setup**
1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Key configuration options:**
   ```bash
   # Frontend Configuration
   FRONTEND_URL=http://localhost:5175
   
   # Backend Configuration
   PORT=3002
   HOST=localhost
   NODE_ENV=development
   
   # Database Configuration (File-based by default)
   REPOSITORY_TYPE=file
   DATA_DIR=./data
   ```

### **Port Configuration**
- **Frontend (Vite):** 5176 (configured in `vite.config.js`)
- **Backend (Node.js):** 3002 (configured in environment)
- **Proxy Setup:** Frontend proxies `/api/*` to backend

---

## 🔍 **VERIFICATION STEPS**

### **1. Check Services Are Running**
```bash
# Check frontend
curl http://localhost:5176

# Check backend health
curl http://localhost:3002/api/health

# Check voting endpoint  
curl http://localhost:3002/api/vote/test
```

### **2. Browser Verification**
1. Open http://localhost:5176
2. You should see the **Base Model 1** globe
3. Globe should be rotating smoothly
4. Channel towers should be visible
5. Browser console should show no critical errors

### **3. Vote System Check**
1. Click on a channel tower
2. Click a "Vote" button
3. Verify vote count increments
4. Check browser console for transaction ID

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **"Cannot GET /" or Port Conflicts**
```bash
# Check what's using the ports
netstat -ano | findstr :5176  # Windows
lsof -i :5176                 # Mac/Linux

# Kill processes if needed
taskkill /PID [process_id] /F  # Windows
kill -9 [process_id]          # Mac/Linux
```

#### **Backend Connection Failed**
1. Verify backend is running: `curl http://localhost:3002/api/health`
2. Check proxy configuration in `vite.config.js`
3. Restart both services

#### **Vote System Not Working**
1. Check backend logs in terminal
2. Verify data directory exists: `ls data/` or `dir data\`
3. Test vote endpoint directly:
   ```bash
   curl -X POST http://localhost:3002/api/vote \
     -H "Content-Type: application/json" \
     -d '{"id":"c1-1","value":"support"}'
   ```

#### **Dependencies Issues**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

---

## 🎯 **DEVELOPMENT WORKFLOW**

### **Daily Development**
1. **Start System:** `npm run dev`
2. **Open Browser:** http://localhost:5176
3. **Code Changes:** Auto-reload enabled
4. **API Testing:** Use browser dev tools or curl

### **Making Changes**
- **Frontend:** Edit files in `src/base-model-1/`
- **Backend:** Edit files in `src/backend/`
- **Voting:** Main logic in `src/backend/routes/vote.mjs`
- **Globe:** Core globe in `src/base-model-1/core/GlobeCore.jsx`

### **Testing Changes**
1. **Auto-reload:** Frontend changes reload automatically
2. **Backend:** Restart backend service for changes
3. **Voting:** Test with vote buttons or PowerShell script
4. **Panels:** Drag-and-drop to test workspace features

---

## 📊 **SERVICE STATUS MONITORING**

### **Check Service Health**
```javascript
// Run in browser console
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('Backend Status:', data));

// Check voting system
fetch('/api/vote/test')
  .then(r => r.json())
  .then(data => console.log('Vote System:', data));
```

### **Monitor Performance**
- **Frontend:** F12 → Performance tab
- **Backend:** Check terminal output for response times
- **Memory:** Task Manager → Node.js processes
- **Network:** F12 → Network tab for API calls

---

## 🎮 **FEATURE OVERVIEW**

### **What You'll See**
1. **3D Globe:** Rotating Earth with channel towers
2. **Voting Interface:** Click towers → Vote on candidates
3. **Workspace Panels:** Draggable panels (chat, biometric, etc.)
4. **Real-time Updates:** Vote counts update immediately

### **Key Interactions**
- **Globe Rotation:** Automatic smooth rotation
- **Channel Selection:** Click on towers to open channels
- **Voting:** Click vote buttons to submit votes to blockchain
- **Panel Management:** Drag panels to rearrange workspace

---

## 📞 **SUPPORT**

### **Common Commands Reference**
```bash
# Start everything
npm run dev

# Start services individually  
npm run dev:frontend
npm run dev:backend

# Install dependencies
npm install

# Check service status
curl http://localhost:5176        # Frontend
curl http://localhost:3002/api/health  # Backend

# View logs
# Frontend logs appear in terminal
# Backend logs in terminal + logs/app.log
```

### **File Structure Reference**
```
/src/base-model-1/     # Main frontend application
/src/backend/          # Backend API services
/data/                 # Application data (votes, blockchain)
/docs/                 # Documentation (this file)
vite.config.js         # Frontend build configuration
package.json           # Dependencies and scripts
```

---

**Status:** ✅ System ready for development and testing  
**URL:** http://localhost:5176  
**API:** http://localhost:3002  
**Voting:** Fully operational with blockchain recording
