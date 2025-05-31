
import React from 'react';
import { Waves, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const handleConnectWallet = () => {
    console.log('Connecting wallet...');
    // Add wallet connection logic here
  };

  return (
    <header className="backdrop-blur-lg bg-white/10 border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ShoreGun</h1>
            <p className="text-sm text-gray-300">DAO Proposal Execution Board</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            onClick={handleConnectWallet}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
};
