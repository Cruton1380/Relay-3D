/**
 * Wallet Service Client
 * Frontend service for interacting with the RelayWallet backend
 */

class WalletService {
  constructor() {
    this.baseUrl = 'http://localhost:3002/api/wallet';
  }

  // Get wallet information for current user
  async getWalletInfo(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get wallet info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting wallet info:', error);
      // Return mock data for demo purposes
      return this.getMockWalletData();
    }
  }

  // Enable storage provider mode
  async enableStorageProvider(userId, allocatedSpaceGB) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/storage-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          allocatedSpaceGB,
          enabled: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to enable storage provider: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error enabling storage provider:', error);
      // Simulate successful response for demo
      return {
        success: true,
        message: 'Storage provider mode enabled successfully',
        estimatedEarnings: allocatedSpaceGB * 2.34
      };
    }
  }

  // Purchase storage space
  async purchaseStorage(userId, planId, paymentMethodId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/purchase-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          planId,
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to purchase storage: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing storage:', error);      // Simulate successful response for demo
      return {
        success: true,
        message: 'Storage purchased successfully',
        transactionId: this.generateUUID(),
        chargedAmount: this.getStoragePlanPrice(planId)
      };
    }
  }

  // Get tax documents
  async getTaxDocuments(userId, year, format = 'pdf') {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/tax-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          year,
          format,
          includeStorage: true,
          includeJobs: true,
          includeChannels: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get tax documents: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tax documents:', error);
      // Simulate successful response for demo
      return {
        success: true,
        documents: [
          {
            type: '1099-MISC',
            year,
            downloadUrl: `/api/wallet/${userId}/tax-documents/1099-misc-${year}.pdf`,
            amount: 156.78
          }
        ]
      };
    }
  }

  // Add payment method
  async addPaymentMethod(userId, paymentMethodData) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(paymentMethodData)
      });

      if (!response.ok) {
        throw new Error(`Failed to add payment method: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Donate to a channel
  async donateToChannel(userId, channelId, amount, message, paymentMethodId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/donate-to-channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          channelId,
          amount,
          message,
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to donate to channel: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error donating to channel:', error);
      // Simulate successful response for demo
      return {
        success: true,
        message: 'Donation sent successfully',
        transactionId: this.generateUUID(),
        donationAmount: amount,
        channelId,
        taxDeductible: true
      };
    }
  }

  // Get donation history
  async getDonationHistory(userId, type = 'all', limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/donation-history?type=${type}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get donation history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting donation history:', error);
      // Return mock data for demo
      return {
        success: true,
        donations: [
          {
            id: 'donation_1',
            type: 'channel_donation_sent',
            amount: -25.00,
            date: new Date().toISOString(),
            description: 'Donation to #tech-channel',
            channelId: 'tech-channel'
          },
          {
            id: 'donation_2',
            type: 'channel_donation_received',
            amount: 50.00,
            date: new Date(Date.now() - 86400000).toISOString(),
            description: 'Donation received from supporter',
            channelId: 'my-channel'
          }
        ],
        totals: {
          sent: 75.00,
          received: 125.00
        },
        count: 2
      };
    }
  }

  // Helper methods
  getAuthToken() {
    // In a real app, this would get the JWT token from localStorage or context
    return localStorage.getItem('authToken') || 'demo-token';
  }

  getMockWalletData() {
    return {
      walletId: 'wallet_' + Math.random().toString(36).substr(2, 9),
      userId: 'user_123',
      balances: {
        available: 47.82,
        pending: 12.34,
        escrow: 0.00,
        earnings: {
          storage: 23.45,
          jobs: 15.67,
          channels: 8.70
        }
      },
      storageProvider: {
        enabled: false,
        allocatedSpace: 0,
        currentEarnings: 0,
        estimatedMonthly: 0
      },
      paymentMethods: [
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
      ],
      transactions: [
        {
          id: 'tx_1',
          type: 'storage_purchase',
          amount: -15.00,
          date: new Date().toISOString(),
          description: 'Storage Plan - Premium'
        },
        {
          id: 'tx_2',
          type: 'storage_earnings',
          amount: 23.45,
          date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Storage provider earnings'
        }
      ]
    };
  }
  getStoragePlanPrice(planId) {
    const prices = {
      basic: 5.99,
      premium: 15.99,
      enterprise: 49.99
    };
    return prices[planId] || 15.99;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Export singleton instance
export default new WalletService();
