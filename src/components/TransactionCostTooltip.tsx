
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info } from 'lucide-react';
import { formatFeeEstimate } from '@/lib/contractService';

interface TransactionCostTooltipProps {
  totalFee: bigint;
  entropyFee?: bigint;
  gasEstimate?: bigint;
  className?: string;
}

export const TransactionCostTooltip: React.FC<TransactionCostTooltipProps> = ({
  totalFee,
  entropyFee,
  gasEstimate,
  className = ''
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center space-x-1 cursor-help ${className}`}>
            <Info className="w-3 h-3 text-blue-400" />
            <Badge className="bg-green-500/20 text-green-300 text-xs">
              {formatFeeEstimate(totalFee)}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-white/20 p-3 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm font-medium">Transaction Cost</span>
            </div>
            
            <div className="space-y-1 text-xs text-gray-300">
              {entropyFee && (
                <div className="flex justify-between">
                  <span>Entropy Fee:</span>
                  <span>{formatFeeEstimate(entropyFee)}</span>
                </div>
              )}
              {gasEstimate && (
                <div className="flex justify-between">
                  <span>Gas Estimate:</span>
                  <span>{formatFeeEstimate(gasEstimate)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-600">
                <span>Buffer (15%):</span>
                <span>Included</span>
              </div>
            </div>
            
            <p className="text-xs text-blue-300 mt-2">
              Uses Pyth Entropy for true randomness
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
