
import { writeContract, simulateContract, watchContractEvent } from 'wagmi/actions';
import { formatEther, keccak256, toBytes } from 'viem';
import { optimism, optimismSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESSES, config } from '../Web3Provider';
import { PROPOSAL_DECISION_ABI } from './abis';
import { FeeService } from './feeService';

export class TaskAssignmentService {
  private feeService: FeeService;

  constructor() {
    this.feeService = new FeeService();
  }

  async assignTaskRandomly(taskId: string, eligibleMembers: string[], chainId: number, account: string): Promise<string> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) {
        throw new Error(`Contract not deployed on chain ${chainId}`);
      }

      // Get the entropy fee
      const entropyFee = await this.feeService.getEntropyFee(chainId);
      
      // Add 20% buffer for gas price fluctuations
      const feeWithBuffer = (entropyFee * BigInt(120)) / BigInt(100);

      // Generate user random number for additional entropy
      const userRandomNumber = keccak256(toBytes(`${taskId}-${Date.now()}-${Math.random()}`));

      console.log('Assigning task with params:', {
        taskId,
        eligibleMembers,
        userRandomNumber,
        entropyFee: formatEther(feeWithBuffer) + ' ETH'
      });

      // First simulate the contract call to catch any revert reasons
      try {
        await simulateContract(config, {
          address: contractAddress as `0x${string}`,
          abi: PROPOSAL_DECISION_ABI,
          functionName: 'assignTask',
          args: [taskId, eligibleMembers as `0x${string}`[], userRandomNumber],
          value: feeWithBuffer,
          chainId,
          account: account as `0x${string}`
        });
      } catch (simError) {
        console.error('Contract simulation failed:', simError);
        throw new Error(`Contract call would fail: ${simError instanceof Error ? simError.message : 'Unknown error'}`);
      }

      const txHash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: PROPOSAL_DECISION_ABI,
        functionName: 'assignTask',
        args: [taskId, eligibleMembers as `0x${string}`[], userRandomNumber],
        value: feeWithBuffer,
        chainId,
        account: account as `0x${string}`,
        chain: chainId === optimism.id ? optimism : optimismSepolia
      });

      console.log('Task assignment transaction submitted successfully:', txHash);
      return txHash;
    } catch (error) {
      console.error('Failed to assign task on blockchain:', error);
      throw error;
    }
  }

  watchTaskAssignments(chainId: number, callback: (event: any) => void): () => void {
    const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!contractAddress) {
      console.error(`Contract not deployed on chain ${chainId}`);
      return () => {};
    }

    console.log(`Starting to watch TaskAssigned events on chain ${chainId}`);

    const unwatch = watchContractEvent(config, {
      address: contractAddress as `0x${string}`,
      abi: PROPOSAL_DECISION_ABI,
      eventName: 'TaskAssigned',
      chainId,
      onLogs: (logs) => {
        logs.forEach((log) => {
          console.log('TaskAssigned event received:', log);
          callback(log);
        });
      },
      onError: (error) => {
        console.error('Error watching TaskAssigned events:', error);
      }
    });

    return unwatch;
  }
}
