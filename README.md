# Relay Network SDK

**Decentralized Consensus and Privacy for Modern Applications**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)](https://nodejs.org/)
[![Production Ready](https://img.shields.io/badge/production-ready-green.svg)](https://relay.network)

## 🚀 Quick Start

> **📖 New user? Start with [documentation/GETTING-STARTED.md](./documentation/GETTING-STARTED.md)**

### **Start the System**
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start everything with one command!
npm start
```

### **Alternative Methods:**
```bash
# Step-by-step (manual control)
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2

# Alternative one-command
npm run start:complete
```

### **What Gets Started:**
- ✅ All Backend Services (API, WebSocket, Blockchain, Auth)
- ✅ Frontend Interface (Globe visualization, Voting UI)
- ✅ Real-time Communication Systems
- ✅ Privacy & Consensus Features
- ✅ **Browser auto-opens to http://localhost:5175**

### **Access Points:**
- **Frontend**: http://localhost:5175 (auto-opens)
- **Backend API**: http://localhost:3002

### **Other Commands:**
```bash
# Production deployment
npm run build:all

# Start only backend services
npm run services:all

# Start only frontend
npm run dev:frontend
```

## 📋 Project Structure

```
RelayCodeBase/
├── 📁 src/                     # Source code
│   ├── 🔧 backend/             # Backend services and APIs
│   ├── 🎨 frontend/            # Frontend application
│   └── 📚 lib/                 # Shared libraries
├── 📖 documentation/           # Comprehensive documentation
│   ├── 📖 GETTING-STARTED.md   # Quick setup guide
│   ├── 🛠️  DEVELOPMENT/        # Development guides
│   └── 🔧 API/                 # API documentation
├── 🧪 examples/                # Demos and validation scripts
├── 🧪 tests/                   # Comprehensive test suites
├── 🔧 scripts/                 # Deployment and utility scripts
├── 🛠️  tools/                  # Development tools
├── ⚙️  config/                 # Configuration files
├── 📊 data/                    # Runtime data storage
└── 🎯 public/                  # Static assets
```

## 🛠️ Backend Architecture

Our backend follows a microservices architecture:

```
src/backend/
├── 📡 api/                     # REST API endpoints
├── 🔐 auth/                    # Authentication & authorization
├── 💬 channel-service/         # Communication channels
├── 🔍 hardware-scanning-service/ # Device discovery
├── 👥 social-service/          # Social interactions
├── 🗳️  voting/                 # Democratic governance
├── 🔒 security/                # Cryptographic services
├── 🌐 hashgraph/               # Consensus algorithms
├── 📡 websocket-service/       # Real-time communication
└── 🏗️  services/               # Core service infrastructure
```

## 📖 Documentation

### For Users
- **[Getting Started](documentation/GETTING-STARTED.md)** - Quick setup guide
- **[User Guides](documentation/USER-GUIDES/)** - Complete user documentation
- **[Security & Privacy](documentation/PRIVACY/)** - Privacy-first approach

### For Developers
- **[Developer Setup](documentation/DEVELOPMENT/DEVELOPER-SETUP-GUIDE.md)** - Complete development setup
- **[Splitability Guide](documentation/DEVELOPMENT/SPLITABILITY-GUIDE.md)** - Frontend/backend separation
- **[API Documentation](documentation/API/)** - Backend APIs
- **[Architecture Overview](documentation/RELAY-OVERVIEW.md)** - System design

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the system**
   ```bash
   npm start
   ```

## 🎯 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start both frontend and backend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run services:all` | Start all microservices |
| `npm run build:all` | Build for production deployment |
| `npm test` | Run all tests |
| `npm run security:check` | Run security audit |

## 🌟 Key Features

- **🔒 Privacy-First**: Zero-knowledge proofs and end-to-end encryption
- **🗳️ Democratic Governance**: Decentralized voting and consensus
- **📱 Cross-Platform**: Web, mobile, and desktop support
- **🔗 Interoperable**: Works with existing blockchain networks
- **⚡ High Performance**: Optimized for scale and speed
- **🧪 Thoroughly Tested**: Comprehensive test coverage with security validation
- **🛡️ Guardian Recovery**: Advanced cryptographic key recovery system
- **🔐 TEE Integration**: Trusted Execution Environment support

## 🧪 Examples

Explore our comprehensive examples:

```bash
# Run simple hashgraph demo
cd examples && node demos/simpleHashgraphDemo.mjs

# Test key space integration
node demos/keySpaceIntegrationDemo.mjs

# Validate production readiness
node validation/validateHashgraphProduction.mjs
```

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](documentation/DEVELOPMENT/DEVELOPMENT-WORKFLOW.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [relay.network](https://relay.network)
- **Documentation**: [documentation/](documentation/)

---

**Built with ❤️ by the Relay Network community**