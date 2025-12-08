# 🔀 Relay Network - Splitability Guide

This guide explains how the Relay Network codebase is structured for easy splitting into separate frontend and backend deployments.

## Current Development Setup

**One Command Development:**
```bash
npm start  # Starts both frontend and backend concurrently
```

This setup is perfect for development but the codebase is structured to easily split later.

## Architecture Overview

### Frontend (`src/frontend/`)
- **Framework**: React + Vite
- **Build Output**: `dist/` (static files)
- **Deployment**: Nginx, CDN, or any static file server
- **API Communication**: Environment-configurable URLs

### Backend (`src/backend/`)
- **Runtime**: Node.js
- **Entry Point**: `src/backend/server.mjs`
- **Deployment**: PM2, Docker, or direct Node.js
- **API**: REST + WebSocket endpoints

## Environment Configuration

### Development Environment
```bash
# env.development
VITE_API_BASE_URL=http://localhost:3002
VITE_WS_BASE_URL=ws://localhost:3002
```

### Production Environment
```bash
# env.production
VITE_API_BASE_URL=https://api.relay.network
VITE_WS_BASE_URL=wss://api.relay.network
```

### Backend Environment
```bash
# Backend uses standard environment variables
PORT=3002
NODE_ENV=production
CORS_ORIGINS=https://relay.network
```

## Building for Split Deployment

### Build Frontend for Standalone Deployment
```bash
# Build frontend with production environment
NODE_ENV=production npm run build:frontend:standalone
```

**Output**: `dist/` directory with:
- Static HTML, CSS, JS files
- `nginx.conf` configuration
- `deployment-info.json` with build details

### Build Backend for Standalone Deployment
```bash
# Build backend for standalone deployment
NODE_ENV=production npm run build:backend:standalone
```

**Output**: `backend-dist/` directory with:
- Backend source code
- `ecosystem.config.js` (PM2 config)
- `Dockerfile` and `docker-compose.yml`
- Startup scripts

### Build Both for Split Deployment
```bash
# Build both frontend and backend
npm run build:all
```

## Deployment Scenarios

### Scenario 1: Same Server, Different Ports
```
Frontend: Nginx on port 80/443
Backend: Node.js on port 3002
```

### Scenario 2: Different Servers
```
Frontend: CDN (CloudFlare, AWS CloudFront)
Backend: Dedicated server with PM2/Docker
```

### Scenario 3: Containerized Deployment
```
Frontend: Docker container with Nginx
Backend: Docker container with Node.js
```

## Configuration for Split Deployment

### Frontend Configuration
The frontend automatically detects its environment and configures API URLs:

```javascript
// Automatically uses environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:3002";
```

### Backend Configuration
The backend uses standard environment variables:

```javascript
// Backend automatically configures CORS and ports
const port = process.env.PORT || 3002;
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5175'];
```

## File Structure for Splitability

```
RelayCodeBaseV87/
├── src/
│   ├── frontend/           # Frontend source (React + Vite)
│   │   ├── components/     # React components
│   │   ├── services/       # API client services
│   │   └── hooks/          # React hooks
│   └── backend/            # Backend source (Node.js)
│       ├── server.mjs      # Main server entry point
│       ├── api/            # REST API endpoints
│       └── services/       # Business logic services
├── dist/                   # Frontend build output
├── backend-dist/           # Backend build output
├── env.development         # Development environment
├── env.production          # Production environment
└── scripts/
    ├── build-frontend.mjs  # Frontend build script
    └── build-backend.mjs   # Backend build script
```

## Development Workflow

### Current (Convenient)
```bash
npm start  # One command for everything
```

### Future (Split)
```bash
# Frontend development
npm run dev:frontend

# Backend development  
npm run dev:backend

# Or build for deployment
npm run build:all
```

## Security Considerations

### CORS Configuration
The backend automatically configures CORS based on environment:

```javascript
// Development
CORS_ORIGINS=http://localhost:3000,http://localhost:5175

// Production
CORS_ORIGINS=https://relay.network,https://www.relay.network
```

### Environment Variables
- Frontend: Uses `VITE_*` prefixed variables (exposed to browser)
- Backend: Uses standard environment variables (server-side only)

## Migration Checklist

When ready to split the deployment:

### Frontend Migration
- [ ] Build frontend: `npm run build:frontend:standalone`
- [ ] Deploy `dist/` to web server
- [ ] Configure `VITE_API_BASE_URL` for production
- [ ] Set up HTTPS certificate
- [ ] Configure nginx.conf (included in build)

### Backend Migration
- [ ] Build backend: `npm run build:backend:standalone`
- [ ] Deploy `backend-dist/` to server
- [ ] Configure environment variables
- [ ] Start with PM2: `pm2 start ecosystem.config.js`
- [ ] Set up monitoring and logging

### Verification
- [ ] Frontend loads from new URL
- [ ] API calls reach backend
- [ ] WebSocket connections work
- [ ] All features function correctly

## Benefits of This Structure

### Development Benefits
- ✅ **One-command startup** for easy development
- ✅ **Hot reload** for both frontend and backend
- ✅ **Shared development environment**
- ✅ **Easy debugging** with integrated logs

### Deployment Benefits
- ✅ **Independent scaling** of frontend and backend
- ✅ **Different deployment strategies** for each
- ✅ **CDN optimization** for frontend assets
- ✅ **Container orchestration** flexibility
- ✅ **Security isolation** between services

### Maintenance Benefits
- ✅ **Clear separation** of concerns
- ✅ **Independent versioning** and releases
- ✅ **Technology flexibility** (can change frontend/backend independently)
- ✅ **Team specialization** (frontend vs backend teams)

## Quick Start for Split Deployment

### 1. Build Everything
```bash
npm run build:all
```

### 2. Deploy Frontend
```bash
# Copy dist/ to your web server
# Configure nginx.conf (included)
# Set VITE_API_BASE_URL environment variable
```

### 3. Deploy Backend
```bash
# Copy backend-dist/ to your server
# Configure environment variables
# Start with PM2: pm2 start ecosystem.config.js
```

### 4. Verify
- Frontend loads correctly
- API calls work
- WebSocket connections establish
- All features function

---

**The codebase is now ready for both convenient development and easy splitting into separate deployments!** 🎉
