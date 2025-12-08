# 🚀 Relay Network - Getting Started

**Decentralized Consensus and Privacy for Modern Applications**

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the system**
   ```bash
   npm start
   ```

That's it! The system will automatically:
- Clean up any conflicting ports
- Start the backend server (port 3002)
- Start the frontend server (port 5175)
- Open your browser to http://localhost:5175

## Access Points

- **Main Interface**: http://localhost:5175
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## Alternative Startup Methods

### Step-by-Step (Manual Control)
```bash
# Terminal 1: Start backend
npm run dev:backend
# Wait for "Server started successfully" message

# Terminal 2: Start frontend
npm run dev:frontend
```

### Alternative One-Command
```bash
npm run start:complete
```

### Manual Port Cleanup (if needed)
```bash
npm run cleanup:ports
```

## Troubleshooting

### If Services Don't Start
1. **Automatic port cleanup should handle most issues** - it runs before each startup
2. Check the terminal output for specific error messages
3. Try the alternative startup method
4. Run manual port cleanup: `npm run cleanup:ports`

### If Backend Keeps Restarting
- Use the step-by-step method instead of one-command
- Check for error messages in the backend terminal

### If Browser Doesn't Open
- Manually navigate to http://localhost:5175
- Make sure the frontend service is running

## What Gets Started

- ✅ All Backend Services (API, WebSocket, Blockchain, Auth)
- ✅ Frontend Interface (Globe visualization, Voting UI)
- ✅ Real-time Communication Systems
- ✅ Privacy & Consensus Features
- ✅ Browser auto-opens to http://localhost:5175

## Development Commands

```bash
# Production deployment
npm run build:all

# Start only backend services
npm run services:all

# Start only frontend
npm run dev:frontend

# Security audit
npm run security:check

# Run tests
npm test
```

## Next Steps

1. **Explore the Interface**: Navigate the 3D globe and voting system
2. **Create Channels**: Set up communication channels for your community
3. **Participate in Governance**: Vote on proposals and participate in consensus
4. **Build Features**: Develop custom applications using the Relay Network SDK

## Need Help?

- **Technical Issues**: See [Troubleshooting Guide](DEVELOPMENT/TROUBLESHOOTING-GUIDE.md)
- **Development**: See [Developer Setup Guide](DEVELOPMENT/DEVELOPER-SETUP-GUIDE.md)
- **Architecture**: See [Relay Overview](RELAY-OVERVIEW.md)
- **API Reference**: See [API Documentation](API/)

---

**Welcome to the Relay Network!** 🌐