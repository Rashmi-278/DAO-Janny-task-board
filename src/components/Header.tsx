
import React from 'react';
import { Waves, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectKitButton } from "connectkit";
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="backdrop-blur-lg bg-white/10 border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DAO Janny</h1>
            <p className="text-sm text-gray-300">DAO Proposal Execution Board</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleProfileClick}
              className="bg-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
            >
              <User className="w-4 h-4" />
            </Button>
          )}
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
};
