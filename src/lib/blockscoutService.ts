
import { notificationService } from '@/lib/notificationService';

interface BlockscoutConfig {
  apiKey?: string;
  baseUrl?: string;
  network?: string;
  rpcUrl?: string;
}

class BlockscoutService {
  private config: BlockscoutConfig = {};
  private isConnected: boolean = false;
  private openTxToast: ((chainId: string, txHash: string) => Promise<void>) | null = null;
  private openPopup: ((params: { chainId: string; address?: string }) => void) | null = null;

  initialize(config: BlockscoutConfig) {
    this.config = {
      apiKey: config.apiKey || import.meta.env.VITE_PUBLIC_BLOCKSCOUT_API_KEY,
      baseUrl: config.baseUrl || 'https://optimism.blockscout.com',
      network: config.network || 'optimism',
      rpcUrl: config.rpcUrl || 'https://optimism.drpc.org'
    };
    
    this.isConnected = true;
    
    console.log('Blockscout Service initialized successfully', this.config);
    
    notificationService.notifyBlockscoutEvent(
      'Service Initialized', 
      `Connected to ${this.config.network} network via ${this.config.baseUrl}`
    );
  }

  // Set the notification hooks from the Blockscout SDK
  setNotificationHooks(
    openTxToast: (chainId: string, txHash: string) => Promise<void>,
    openPopup: (params: { chainId: string; address?: string }) => void
  ) {
    this.openTxToast = openTxToast;
    this.openPopup = openPopup;
  }

  async getTransactionDetails(txHash: string) {
    if (!this.isConnected) {
      throw new Error('Blockscout Service not initialized');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2/transactions/${txHash}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const transaction = await response.json();
      
      // Use Blockscout SDK notification if available
      if (this.openTxToast) {
        await this.openTxToast("10", txHash); // Optimism chain ID
      }
      
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
    if (!this.isConnected) {
      throw new Error('Blockscout Service not initialized');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v2/addresses/${address}/transactions?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const transactions = data.items || [];
      
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
    if (!this.isConnected) {
      throw new Error('Blockscout Service not initialized');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v2/tokens/${tokenAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tokenInfo = await response.json();
      
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

  // Monitor address for new transactions using polling
  async watchAddress(address: string, callback?: (transaction: any) => void) {
    if (!this.isConnected) {
      throw new Error('Blockscout Service not initialized');
    }

    console.log(`Starting to watch address: ${address}`);
    
    notificationService.notifyBlockscoutEvent(
      'Address Monitoring Started',
      `Now monitoring ${address.slice(0, 6)}...${address.slice(-4)} for new transactions on Optimism`
    );

    // Poll for new transactions every 30 seconds
    const pollInterval = setInterval(async () => {
      try {
        const transactions = await this.getAddressTransactions(address, 1, 5);
        if (transactions.length > 0) {
          const latestTx = transactions[0];
          
          // Use Blockscout SDK notification for transaction popup
          if (this.openPopup) {
            this.openPopup({
              chainId: "10", // Optimism chain ID
              address: address
            });
          }
          
          notificationService.notifyBlockscoutEvent(
            'Transaction Activity Detected',
            `Latest transaction: ${latestTx.hash?.slice(0, 10)}... on Optimism`
          );
          
          if (callback) {
            callback(latestTx);
          }
        }
      } catch (error) {
        console.error('Error polling address transactions:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
      notificationService.notifyBlockscoutEvent(
        'Address Monitoring Stopped',
        `Stopped monitoring ${address.slice(0, 6)}...${address.slice(-4)}`
      );
    };
  }

  // Method to show transaction history popup
  showTransactionHistory(address?: string) {
    if (this.openPopup) {
      this.openPopup({
        chainId: "10", // Optimism chain ID
        address: address
      });
    }
  }

  // Method to show transaction toast
  async showTransactionToast(txHash: string) {
    if (this.openTxToast) {
      await this.openTxToast("10", txHash); // Optimism chain ID
    }
  }

  isInitialized(): boolean {
    return this.isConnected;
  }

  getConfig(): BlockscoutConfig {
    return this.config;
  }
}

export const blockscoutService = new BlockscoutService();
