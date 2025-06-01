
import React, { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { contractService } from '@/lib/contractService';

interface FeeEstimatorProps {
  taskId: string;
  eligibleMembers: string[];
  onFeeEstimated?: (totalFee: bigint, entropyFee?: bigint, gasEstimate?: bigint) => void;
  className?: string;
}

export const FeeEstimator: React.FC<FeeEstimatorProps> = ({
  taskId,
  eligibleMembers,
  onFeeEstimated,
  className = ''
}) => {
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const estimateFees = async () => {
      if (!taskId || !eligibleMembers.length) return;

      setIsLoading(true);

      try {
        // Get entropy fee and gas estimate in parallel
        const [entropy, gas] = await Promise.all([
          contractService.getEntropyFee(chainId),
          contractService.estimateTaskAssignmentGas(taskId, eligibleMembers, chainId)
        ]);

        // Calculate total with 15% buffer
        const total = ((entropy + gas) * BigInt(115)) / BigInt(100);
        
        onFeeEstimated?.(total, entropy, gas);
      } catch (err) {
        console.error('Fee estimation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    estimateFees();
  }, [taskId, eligibleMembers, chainId, onFeeEstimated]);

  // This component is now hidden and only used for fee calculation
  return null;
};
