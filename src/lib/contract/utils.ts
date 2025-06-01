
import { formatEther } from 'viem';

export const formatFeeEstimate = (fee: bigint): string => {
  return `${formatEther(fee)} ETH`;
};

export const getRoleFromCategory = (category: string): string | undefined => {
  const mapping: Record<string, string> = {
    'governance': 'governance',
    'treasury': 'treasury',
    'technical': 'technical',
    'community': 'community',
    'grants': 'grants',
    'operations': 'operations'
  };
  return mapping[category.toLowerCase()];
};
