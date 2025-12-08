# 🧪 Relay Testing & Development Guide

**Consolidated from multiple testing documentation files**

---

## 🚀 **CURRENT SYSTEM STATUS**

### **Access Points**
- **Main Application:** http://localhost:5176 (Base Model 1)
- **Backend API:** http://localhost:3002
- **Mobile Access:** Use your local network IP + :5176
- **WebSocket:** Active for real-time features

### **Services Running**
- ✅ **Frontend Dev Server** (Vite on port 5176)
- ✅ **Backend Server** (Node.js on port 3002)  
- ✅ **Voting System** (Blockchain integration active)
- ✅ **Workspace Management** (Panel docking system)

---

## 🧪 **TESTING PROCEDURES**

### **1. Voting System Testing**
```powershell
# PowerShell test script available at:
test-vote-powershell.ps1

# Test endpoints:
GET /api/vote/debug/blockchain-summary   # Check blockchain state
POST /api/vote                          # Submit vote
GET /api/vote/debug/test-data           # View test data
```

**Manual Testing Steps:**
1. Open http://localhost:5176
2. Click on a channel tower on the globe
3. Click "Vote" button on a candidate
4. Verify "✓ Voted" status appears
5. Check browser console for blockchain transaction ID

### **2. Workspace Panel Testing**
1. **Panel Dragging:** Drag panels by their headers
2. **Snap Zones:** Drag near other panels to see purple snap zones
3. **Docking:** Drop panels on snap zones to dock them
4. **Persistence:** Refresh page to verify layout saves
5. **Layout Favorites:** Use layout management controls

### **3. Globe Interaction Testing**
1. **Rotation:** Globe should auto-rotate smoothly
2. **Channel Towers:** Click towers to open channel details
3. **Zoom Controls:** Use zoom buttons for different views
4. **Performance:** Should maintain 60fps during interaction

---

## 🔧 **DEVELOPMENT PROCEDURES**

### **Starting the System**
```bash
# Option 1: Start both services together
npm run dev

# Option 2: Start services separately
npm run dev:frontend  # Port 5176
npm run dev:backend   # Port 3002
```

### **Common Development Tasks**

#### **Adding New Panels**
1. Create component in `src/base-model-1/panels/`
2. Import into `WorkspaceLayout.jsx`
3. Add to default panels array
4. Test drag-and-drop functionality

#### **Modifying Vote System**
1. Backend changes: `src/backend/routes/vote.mjs`
2. Frontend changes: `src/base-model-1/panels/VoteButton.jsx`
3. Test with PowerShell script
4. Verify blockchain recording

#### **Globe Modifications**
1. Main globe logic: `src/base-model-1/core/GlobeCore.jsx`
2. Channel data: `src/base-model-1/data/channelData.js`
3. Shader modifications: Fragment shader in GlobeCore
4. Test rotation and interaction

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

#### **Port Conflicts**
- **Frontend:** Should run on 5176
- **Backend:** Should run on 3002
- **Solution:** Check `vite.config.js` proxy settings

#### **Vote System 404 Errors**
- **Cause:** Backend not running or API proxy misconfigured
- **Check:** `POST /api/vote` endpoint accessibility
- **Solution:** Restart backend service

#### **Panel Layout Issues**
- **Cause:** localStorage corruption or grid conflicts
- **Solution:** Clear browser localStorage for localhost:5176
- **Reset:** Use "Reset Layout" in workspace controls

#### **Globe Not Rendering**
- **Cause:** WebGL compatibility or Three.js errors
- **Check:** Browser console for WebGL errors
- **Solution:** Update graphics drivers or try different browser

---

## 📊 **VERIFICATION PROCEDURES**

### **System Health Check**
```javascript
// Run in browser console at http://localhost:5176
console.log('Frontend Status:', window.location.port === '5176' ? '✅' : '❌');

// Check API connectivity
fetch('/api/health').then(r => r.json()).then(console.log);

// Check voting endpoint
fetch('/api/vote/test').then(r => r.json()).then(console.log);
```

### **Vote System Verification**
1. **Submit Test Vote:** Click vote button on any candidate
2. **Check Response:** Browser network tab should show 200 status
3. **Verify Blockchain:** Check browser console for transaction ID
4. **Confirm Count:** Vote count should increment immediately

### **Workspace Verification**
1. **Panel Creation:** All 5 panels should be visible on load
2. **Drag Functionality:** Headers should be draggable
3. **Snap Zones:** Purple zones should appear when dragging
4. **Persistence:** Layout should restore after page refresh

---

## 🔍 **DEBUGGING PROCEDURES**

### **Frontend Debugging**
```bash
# Enable verbose logging
NODE_ENV=development npm run dev:frontend

# Browser dev tools
F12 → Console → Check for React/Vite errors
F12 → Network → Monitor API calls
F12 → Application → Check localStorage
```

### **Backend Debugging**
```bash
# Enable debug mode
DEBUG=relay:* npm run dev:backend

# Check logs
tail -f logs/app.log

# Monitor vote endpoint
curl -X POST http://localhost:3002/api/vote \
  -H "Content-Type: application/json" \
  -d '{"id":"c1-1","value":"support"}'
```

### **Database Debugging**
```bash
# Check blockchain file
cat data/chain.jsonl | tail -5

# Check vote sessions
cat data/session-votes.json

# Check user data
cat data/users.json
```

---

## 📈 **PERFORMANCE TESTING**

### **Load Testing**
```bash
# Install artillery for load testing
npm install -g artillery

# Test vote endpoint
artillery quick --count 10 --num 5 http://localhost:3002/api/vote
```

### **Frontend Performance**
1. **Lighthouse Audit:** F12 → Lighthouse → Performance
2. **Frame Rate:** Should maintain 60fps during globe rotation
3. **Bundle Size:** Check Vite build output
4. **Memory Usage:** Monitor in Task Manager during extended use

---

## 🎯 **TESTING CHECKLIST**

### **Pre-Deployment Testing**
- [ ] Frontend loads at http://localhost:5176
- [ ] Backend responds at http://localhost:3002/api/health
- [ ] Vote submission returns HTTP 200
- [ ] Blockchain recording working (check transaction ID)
- [ ] All 5 panels render correctly
- [ ] Panel drag-and-drop functional
- [ ] Globe rotates smoothly
- [ ] Channel towers clickable
- [ ] Layout persistence working
- [ ] Console shows no critical errors

### **User Acceptance Testing**
- [ ] New user can understand voting interface
- [ ] Panel management is intuitive
- [ ] Globe interaction feels responsive
- [ ] Vote feedback is clear and immediate
- [ ] System performance is acceptable
- [ ] No crashes during extended use

---

## 📞 **SUPPORT & ESCALATION**

### **Development Support**
- **Configuration Issues:** Check `vite.config.js` and `package.json`
- **API Errors:** Verify backend service status and routes
- **Panel Issues:** Clear localStorage and reset layout
- **Performance Issues:** Run Lighthouse audit and check console

### **Critical Issues**
- **System Won't Start:** Check port conflicts and dependencies
- **Voting Not Working:** Verify blockchain service and API endpoints
- **Data Loss:** Check data directory and backup procedures
- **Security Concerns:** Review authentication and validation logic

---

This consolidated testing guide combines information from:
- `RELAY_TESTING_GUIDE.md`
- `test-vote-powershell.ps1`
- `VOTE_SYSTEM_IMPLEMENTATION_COMPLETE.md`
- Integration test results from Base Model 1
