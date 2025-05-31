
import { BlockscoutSDK } from '@blockscout/app-sdk';
import { notificationService } from '@/lib/notificationService';

interface BlockscoutConfig {
  apiKey?: string;
  baseUrl?: string;
  network?: string;
}

class BlockscoutService {
  private sdk: BlockscoutSDK | null = null;
  private config: BlockscoutConfig = {};

  initialize(config: BlockscoutConfig) {
    this.config = config;
    
    try {
      this.sdk = new BlockscoutSDK({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://eth.blockscout.com',
        network: config.network || 'ethereum'
      });
      
      console.log('Blockscout SDK initialized successfully');
      
      notificationService.notifyBlockscoutEvent(
        'SDK Initialized', 
        `Connected to ${config.network || 'ethereum'} network`
      );
    } catch (error) {
      console.error('Failed to initialize Blockscout SDK:', error);
    }
  }

  async getTransactionDetails(txHash: string) {
    if (!this.sdk) {
      throw new Error('Blockscout SDK not initialized');
    }

    try {
      const transaction = await this.sdk.getTransaction(txHash);
      
      notificationService.notifyBlockscoutEvent(
        'Transaction Retrieved',
        `Transaction ${txHash.slice(0, 10)}... details loaded`
      );
      
      return transaction;
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      throw error;
    }
  }

  async getAddressTransactions(address: string, page = 1, limit = 10) {
    if (!this.sdk) {
      throw new Error('Blockscout SDK not initialized');
    }

    try {
      const transactions = await this.sdk.getAddressTransactions(address, {
        page,
        limit
      });
      
      notificationService.notifyBlockscoutEvent(
        'Address Activity',
        `Loaded ${transactions.length} transactions for ${address.slice(0, 6)}...${address.slice(-4)}`
      );
      
      return transactions;
    } catch (error) {
      console.error('Failed to get address transactions:', error);
      throw error;
    }
  }

  async getTokenInfo(tokenAddress: string) {
    if (!this.sdk) {
      throw new Error('Blockscout SDK not initialized');
    }

    try {
      const tokenInfo = await this.sdk.getTokenInfo(tokenAddress);
      
      notificationService.notifyBlockscoutEvent(
        'Token Info Retrieved',
        `Loaded info for token ${tokenInfo.name || 'Unknown'}`
      );
      
      return tokenInfo;
    } catch (error) {
      console.error('Failed to get token info:', error);
      throw error;
    }
  }

  // Monitor address for new transactions
  async watchAddress(address: string, callback?: (transaction: any) => void) {
    if (!this.sdk) {
      throw new Error('Blockscout SDK not initialized');
    }

    console.log(`Starting to watch address: ${address}`);
    
    notificationService.notifyBlockscoutEvent(
      'Address Monitoring Started',
      `Now monitoring ${address.slice(0, 6)}...${address.slice(-4)} for new transactions`
    );

    // This would typically use websockets or polling
    // For demo purposes, we'll simulate monitoring
    const simulateMonitoring = () => {
      // In a real implementation, this would be connected to Blockscout's real-time API
      setTimeout(() => {
        notificationService.notifyBlockscoutEvent(
          'New Transaction Detected',
          `New activity detected for ${address.slice(0, 6)}...${address.slice(-4)}`
        );
        
        if (callback) {
          callback({
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            from: address,
            to: `0x${Math.random().toString(16).substr(2, 40)}`,
            value: '0.1',
            timestamp: new Date()
          });
        }
      }, 10000); // Simulate activity every 10 seconds
    };

    simulateMonitoring();
  }

  isInitialized(): boolean {
    return this.sdk !== null;
  }

  getConfig(): BlockscoutConfig {
    return this.config;
  }
}

export const blockscoutService = new BlockscoutService();
