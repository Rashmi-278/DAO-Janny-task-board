
import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { contractService, formatFeeEstimate } from '@/lib/contractService';

interface FeeEstimatorProps {
  taskId: string;
  eligibleMembers: string[];
  onFeeEstimated?: (fee: bigint) => void;
  className?: string;
}

export const FeeEstimator: React.FC<FeeEstimatorProps> = ({
  taskId,
  eligibleMembers,
  onFeeEstimated,
  className = ''
}) => {
  const chainId = useChainId();
  const [entropyFee, setEntropyFee] = useState<bigint | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [totalFee, setTotalFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const estimateFees = async () => {
      if (!taskId || !eligibleMembers.length) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get entropy fee and gas estimate in parallel
        const [entropy, gas] = await Promise.all([
          contractService.getEntropyFee(chainId),
          contractService.estimateTaskAssignmentGas(taskId, eligibleMembers, chainId)
        ]);

        setEntropyFee(entropy);
        setGasEstimate(gas);

        // Calculate total with 15% buffer
        const total = ((entropy + gas) * BigInt(115)) / BigInt(100);
        setTotalFee(total);
        
        onFeeEstimated?.(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to estimate fees');
        console.error('Fee estimation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    estimateFees();
  }, [taskId, eligibleMembers, chainId, onFeeEstimated]);

  if (isLoading) {
    return (
      <Card className={`backdrop-blur-lg bg-white/10 border-white/20 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-white text-xs">Estimating fees...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`backdrop-blur-lg bg-red-500/10 border-red-500/20 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-xs">Fee estimation failed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!totalFee) return null;

  return (
    <Card className={`backdrop-blur-lg bg-white/10 border-white/20 ${className}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white text-xs font-medium">Transaction Cost</span>
          </div>
          <Badge className="bg-green-500/20 text-green-300 text-xs">
            {formatFeeEstimate(totalFee)}
          </Badge>
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
          <div className="flex justify-between text-gray-400">
            <span>Buffer (15%):</span>
            <span>Included</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
