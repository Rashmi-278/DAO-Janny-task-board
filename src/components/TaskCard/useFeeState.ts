
import { useState } from 'react';

export const useFeeState = () => {
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
  const [entropyFee, setEntropyFee] = useState<bigint | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);

  const handleFeeEstimated = (totalFee: bigint, entropy?: bigint, gas?: bigint) => {
    setEstimatedFee(totalFee);
    setEntropyFee(entropy || null);
    setGasEstimate(gas || null);
  };

  return {
    estimatedFee,
    entropyFee,
    gasEstimate,
    handleFeeEstimated
  };
};
