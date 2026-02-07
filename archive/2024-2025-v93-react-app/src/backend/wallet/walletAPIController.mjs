/**
 * Wallet API Controller
 * Handles HTTP requests for the Relay Wallet system
 */

import { RelayWallet } from './relayWallet.mjs';

// In-memory store for demo (in production, use a database)
const userWallets = new Map();

export class WalletAPIController {
  constructor() {
    this.setupRoutes();
  }

  setupRoutes() {
    // This would be integrated with your Express.js or similar framework
    console.log('💳 Wallet API Controller initialized');
  }

  // Get or create wallet for user
  async getWallet(userId) {
    if (!userWallets.has(userId)) {
      const wallet = new RelayWallet(userId, {
        currency: 'USD',
        taxRegion: 'US',
        autoTaxReporting: true
      });
      
      // Initialize with some demo data
      wallet.balances = {
        available: 47.82,
        pending: 12.34,
        escrow: 0.00,
        earnings: {
          storage: 23.45,
          jobs: 15.67,
          channels: 8.70
        }
      };

      wallet.paymentMethods = [
        {
          id: 'pm_1',
          type: 'credit_card',
          last4: '4532',
          brand: 'visa',
          isDefault: true,
          expiryMonth: 12,
          expiryYear: 2027
        },
        {
          id: 'pm_2',
          type: 'bank_transfer',
          last4: '8901',
          bankName: 'Chase',
          isDefault: false
        }
      ];

      userWallets.set(userId, wallet);
    }
    
    return userWallets.get(userId);
  }

  // Handle GET /api/wallet/:userId
  async handleGetWalletInfo(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const wallet = await this.getWallet(userId);
      
      const walletInfo = {
        walletId: wallet.walletId,
        userId: wallet.userId,
        balances: wallet.balances,
        storageProvider: wallet.storageProvider || {
          enabled: false,
          allocatedSpace: 0,
          currentEarnings: 0,
          estimatedMonthly: 0
        },
        paymentMethods: wallet.paymentMethods || [],
        transactions: wallet.transactions || []
      };

      res.json(walletInfo);
    } catch (error) {
      console.error('Error getting wallet info:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle POST /api/wallet/:userId/storage-provider
  async handleEnableStorageProvider(req, res) {
    try {
      const { userId } = req.params;
      const { allocatedSpaceGB, enabled } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const wallet = await this.getWallet(userId);
      
      // Enable storage provider
      const result = await wallet.enableStorageProvider({
        allocatedSpaceGB,
        enabled
      });

      res.json({
        success: true,
        message: 'Storage provider mode enabled successfully',
        estimatedEarnings: allocatedSpaceGB * 2.34, // $2.34 per GB per month
        result
      });
    } catch (error) {
      console.error('Error enabling storage provider:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to enable storage provider' 
      });
    }
  }

  // Handle POST /api/wallet/:userId/purchase-storage
  async handlePurchaseStorage(req, res) {
    try {
      const { userId } = req.params;
      const { planId, paymentMethodId } = req.body;

      if (!userId || !planId || !paymentMethodId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID, plan ID, and payment method ID are required' 
        });
      }

      const wallet = await this.getWallet(userId);
      
      // Storage plan pricing
      const planPricing = {
        basic: { cost: 5.99, space: 10 },
        premium: { cost: 15.99, space: 50 },
        enterprise: { cost: 49.99, space: 200 }
      };

      const plan = planPricing[planId];
      if (!plan) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid plan ID' 
        });
      }

      // Process payment
      const result = await wallet.processPayment({
        type: 'storage_purchase',
        amount: plan.cost,
        description: `Storage Plan - ${planId}`,
        paymentMethodId
      });

      res.json({
        success: true,
        message: 'Storage purchased successfully',
        transactionId: result.transactionId,
        chargedAmount: plan.cost,
        storageSpace: plan.space
      });
    } catch (error) {
      console.error('Error purchasing storage:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to purchase storage' 
      });
    }
  }

  // Handle POST /api/wallet/:userId/tax-documents
  async handleGetTaxDocuments(req, res) {
    try {
      const { userId } = req.params;
      const { year, format } = req.body;

      if (!userId || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID and year are required' 
        });
      }

      const wallet = await this.getWallet(userId);
      
      // Generate tax documents
      const result = await wallet.generateTaxDocuments({
        year,
        format: format || 'pdf',
        includeStorage: true,
        includeJobs: true,
        includeChannels: true
      });

      res.json({
        success: true,
        documents: result.documents,
        message: 'Tax documents generated successfully'
      });
    } catch (error) {
      console.error('Error generating tax documents:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate tax documents' 
      });
    }
  }

  // Handle POST /api/wallet/:userId/payment-methods
  async handleAddPaymentMethod(req, res) {
    try {
      const { userId } = req.params;
      const paymentMethodData = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const wallet = await this.getWallet(userId);
      
      // Add payment method
      const result = await wallet.addPaymentMethod(paymentMethodData);

      res.json({
        success: true,
        paymentMethod: result,
        message: 'Payment method added successfully'
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add payment method' 
      });
    }
  }

  // Handle POST /api/wallet/:userId/donate-to-channel
  async handleDonateToChannel(req, res) {
    try {
      const { userId } = req.params;
      const { channelId, amount, message, paymentMethodId } = req.body;

      if (!userId || !channelId || !amount || !paymentMethodId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID, channel ID, amount, and payment method ID are required' 
        });
      }

      if (amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Donation amount must be greater than zero' 
        });
      }

      const wallet = await this.getWallet(userId);
      
      // Process donation payment
      const result = await wallet.processPayment({
        type: 'channel_donation_sent',
        amount: amount,
        description: `Donation to channel ${channelId}${message ? ': ' + message : ''}`,
        paymentMethodId,
        metadata: {
          channelId,
          message: message || '',
          donationType: 'user_donation'
        }
      });

      res.json({
        success: true,
        message: 'Donation sent successfully',
        transactionId: result.transactionId,
        donationAmount: amount,
        channelId,
        taxDeductible: true // Most channel donations are tax deductible
      });
    } catch (error) {
      console.error('Error processing channel donation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process donation' 
      });
    }
  }

  // Handle POST /api/wallet/:userId/receive-channel-donation
  async handleReceiveChannelDonation(req, res) {
    try {
      const { userId } = req.params;
      const { fromUserId, amount, message, channelId } = req.body;

      if (!userId || !fromUserId || !amount || !channelId) {
        return res.status(400).json({ 
          success: false, 
          error: 'All fields are required' 
        });
      }

      const wallet = await this.getWallet(userId);
      
      // Process donation receipt
      const result = await wallet.receivePayment({
        type: 'channel_donation_received',
        amount: amount,
        description: `Donation received from ${fromUserId}${message ? ': ' + message : ''}`,
        fromUserId,
        metadata: {
          channelId,
          message: message || '',
          donationType: 'channel_funding'
        }
      });

      // Update channel earnings
      wallet.balances.earnings.channels += amount;
      wallet.balances.available += amount;

      res.json({
        success: true,
        message: 'Donation received successfully',
        transactionId: result.transactionId,
        donationAmount: amount,
        fromUserId,
        channelEarnings: wallet.balances.earnings.channels
      });
    } catch (error) {
      console.error('Error receiving channel donation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to receive donation' 
      });
    }
  }

  // Handle GET /api/wallet/:userId/donation-history
  async handleGetDonationHistory(req, res) {
    try {
      const { userId } = req.params;
      const { type, limit } = req.query; // type: 'sent', 'received', or 'all'

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const wallet = await this.getWallet(userId);
      
      // Filter transactions for donations
      const allTransactions = Array.from(wallet.transactions.values());
      let donationTransactions = allTransactions.filter(t => 
        t.type.includes('channel_donation')
      );

      // Filter by type if specified
      if (type === 'sent') {
        donationTransactions = donationTransactions.filter(t => 
          t.type === 'channel_donation_sent'
        );
      } else if (type === 'received') {
        donationTransactions = donationTransactions.filter(t => 
          t.type === 'channel_donation_received'
        );
      }

      // Sort by date (newest first) and limit
      donationTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        donationTransactions = donationTransactions.slice(0, parseInt(limit));
      }

      // Calculate totals
      const totals = {
        sent: allTransactions
          .filter(t => t.type === 'channel_donation_sent')
          .reduce((sum, t) => sum + t.amount, 0),
        received: allTransactions
          .filter(t => t.type === 'channel_donation_received')
          .reduce((sum, t) => sum + t.amount, 0)
      };

      res.json({
        success: true,
        donations: donationTransactions,
        totals,
        count: donationTransactions.length
      });
    } catch (error) {
      console.error('Error getting donation history:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get donation history' 
      });
    }
  }
}

// Export singleton instance
export default new WalletAPIController();
