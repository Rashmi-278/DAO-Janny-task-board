
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dice6, DollarSign, AlertTriangle } from 'lucide-react';
import { formatEther } from 'viem';
import { useETHPrice } from '@/hooks/useETHPrice';

interface RandomAssignmentHoverProps {
  isAssigning: boolean;
  estimatedFee: bigint;
  onRandomAssignment: () => void;
  className?: string;
}

export const RandomAssignmentHover: React.FC<RandomAssignmentHoverProps> = ({
  isAssigning,
  estimatedFee,
  onRandomAssignment,
  className = ''
}) => {
  const { ethPrice } = useETHPrice();

  const ethAmount = formatEther(estimatedFee);
  const usdAmount = ethPrice ? (parseFloat(ethAmount) * ethPrice).toFixed(2) : null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onRandomAssignment}
          disabled={isAssigning}
          className={`text-xs h-7 bg-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 ${className}`}
        >
          <Dice6 className="w-3 h-3 mr-1" />
          {isAssigning ? 'Assigning...' : 'Random Assignment'}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 bg-slate-800 border-white/20 p-4 relative z-[99999]" 
        sideOffset={8}
        style={{ zIndex: 99999 }}
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">Paid Transaction</span>
          </div>
          
          <p className="text-gray-300 text-xs">
            This action requires a blockchain transaction to ensure true randomness using Pyth Entropy.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Estimated Cost:</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-500/20 text-green-300 text-xs">
                  {ethAmount} ETH
                </Badge>
                {usdAmount && (
                  <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${usdAmount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-blue-300">
            A competent member will be randomly selected based on the proposal's domain requirements.
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
