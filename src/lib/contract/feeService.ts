
import { readContract, estimateGas } from 'wagmi/actions';
import { parseEther, formatEther, keccak256, toBytes, encodeFunctionData } from 'viem';
import { config } from '../Web3Provider';
import { PROPOSAL_DECISION_ABI, PYTH_ENTROPY_ABI } from './abis';
import { CONTRACT_ADDRESSES, PYTH_ENTROPY_ADDRESSES } from './constants';

export class FeeService {
  private feeCache = new Map<number, { fee: bigint; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minute

  async getEntropyFee(chainId: number): Promise<bigint> {
    // Check cache first
    const cached = this.feeCache.get(chainId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.fee;
    }

    try {
      const entropyAddress = PYTH_ENTROPY_ADDRESSES[chainId as keyof typeof PYTH_ENTROPY_ADDRESSES];
      if (!entropyAddress) {
        throw new Error(`Pyth Entropy not supported on chain ${chainId}`);
      }

      const fee = await readContract(config, {
        address: entropyAddress as `0x${string}`,
        abi: PYTH_ENTROPY_ABI,
        functionName: 'getFee',
        chainId
      });

      // Cache the result
      this.feeCache.set(chainId, { fee: fee as bigint, timestamp: Date.now() });
      
      console.log(`Entropy fee for chain ${chainId}:`, formatEther(fee as bigint), 'ETH');
      return fee as bigint;
    } catch (error) {
      console.error('Failed to get entropy fee:', error);
      // Return a default fee estimate if the call fails
      return parseEther('0.001'); // 0.001 ETH fallback
    }
  }

  async estimateTaskAssignmentGas(taskId: string, members: string[], chainId: number): Promise<bigint> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) {
        throw new Error(`Contract not deployed on chain ${chainId}`);
      }

      const userRandomNumber = keccak256(toBytes(`${taskId}-${Date.now()}-${Math.random()}`));
      
      // Properly encode the function call data
      const callData = encodeFunctionData({
        abi: PROPOSAL_DECISION_ABI,
        functionName: 'assignTask',
        args: [taskId, members as `0x${string}`[], userRandomNumber]
      });
      
      const gasEstimate = await estimateGas(config, {
        to: contractAddress as `0x${string}`,
        data: callData,
        chainId
      });

      console.log('Gas estimate for task assignment:', gasEstimate.toString());
      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return BigInt(200000); // Fallback gas estimate
    }
  }
}

export const feeService = new FeeService();
