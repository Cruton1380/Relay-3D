/**
 * Wallet API Server
 * Simple Express.js server for wallet functionality demo
 */

import express from 'express';
import cors from 'cors';
import walletAPIController from './walletAPIController.mjs';

const app = express();
const PORT = process.env.WALLET_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`💳 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

// Wallet API Routes
app.get('/api/wallet/:userId', (req, res) => {
  walletAPIController.handleGetWalletInfo(req, res);
});

app.post('/api/wallet/:userId/storage-provider', (req, res) => {
  walletAPIController.handleEnableStorageProvider(req, res);
});

app.post('/api/wallet/:userId/purchase-storage', (req, res) => {
  walletAPIController.handlePurchaseStorage(req, res);
});

app.post('/api/wallet/:userId/tax-documents', (req, res) => {
  walletAPIController.handleGetTaxDocuments(req, res);
});

app.post('/api/wallet/:userId/payment-methods', (req, res) => {
  walletAPIController.handleAddPaymentMethod(req, res);
});

// Channel donation routes
app.post('/api/wallet/:userId/donate-to-channel', (req, res) => {
  walletAPIController.handleDonateToChannel(req, res);
});

app.post('/api/wallet/:userId/receive-channel-donation', (req, res) => {
  walletAPIController.handleReceiveChannelDonation(req, res);
});

app.get('/api/wallet/:userId/donation-history', (req, res) => {
  walletAPIController.handleGetDonationHistory(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Relay Wallet API',
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('💳 Wallet API Error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`💳 Relay Wallet API server running on port ${PORT}`);
  console.log(`📄 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api/wallet`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('💳 Shutting down Relay Wallet API server...');
  server.close(() => {
    console.log('💳 Wallet API server stopped');
    process.exit(0);
  });
});

export default server;
