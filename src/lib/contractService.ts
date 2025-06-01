import { 
  readContract, 
  writeContract, 
  watchContractEvent,
  getBalance,
  estimateGas
} from 'wagmi/actions';
import { parseEther, formatEther, keccak256, toBytes } from 'viem';
import { optimism, optimismSepolia } from 'wagmi/chains';
import { CONTRACT_ADDRESSES, PYTH_ENTROPY_ADDRESSES, config } from './Web3Provider';
import type { Member } from './memberService';

// Complete ABI for ProposalDecision contract
export const PROPOSAL_DECISION_ABI = [
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "taskId", "type": "string" },
      { "internalType": "address[]", "name": "eligibleMembers", "type": "address[]" },
      { "internalType": "bytes32", "name": "userRandomNumber", "type": "bytes32" }
    ],
    "name": "assignTask",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "taskId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "assignedTo", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "randomIndex", "type": "uint256" }
    ],
    "name": "TaskAssigned",
    "type": "event"
  }
] as const;

// Pyth Entropy ABI for fee estimation
export const PYTH_ENTROPY_ABI = [
  {
    "inputs": [],
    "name": "getFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Role constants matching the smart contract
export const CONTRACT_ROLES = {
  ADMIN_ROLE: keccak256(toBytes("ADMIN_ROLE")),
  GOVERNANCE_ROLE: keccak256(toBytes("GOVERNANCE_ROLE")),
  TREASURY_ROLE: keccak256(toBytes("TREASURY_ROLE")),
  TECHNICAL_ROLE: keccak256(toBytes("TECHNICAL_ROLE")),
  COMMUNITY_ROLE: keccak256(toBytes("COMMUNITY_ROLE")),
  GRANTS_ROLE: keccak256(toBytes("GRANTS_ROLE")),
  OPERATIONS_ROLE: keccak256(toBytes("OPERATIONS_ROLE"))
} as const;

// Map UI roles to contract roles
export const ROLE_MAPPING = {
  'governance': CONTRACT_ROLES.GOVERNANCE_ROLE,
  'treasury': CONTRACT_ROLES.TREASURY_ROLE,
  'technical': CONTRACT_ROLES.TECHNICAL_ROLE,
  'community': CONTRACT_ROLES.COMMUNITY_ROLE,
  'grants': CONTRACT_ROLES.GRANTS_ROLE,
  'operations': CONTRACT_ROLES.OPERATIONS_ROLE
} as const;

// Domain mapping for task types
export const DOMAIN_MAPPING = {
  'governance': ['governance', 'strategy', 'unassigned'],
  'treasury': ['accounting', 'business_development', 'strategy', 'unassigned'],
  'technical': ['tech', 'contracts', 'unassigned'],
  'community': ['business_development', 'strategy', 'unassigned'],
  'grants': ['accounting', 'business_development', 'strategy', 'unassigned'],
  'operations': ['business_development', 'strategy', 'unassigned']
} as const;

export interface ContractService {
  // Fee estimation
  getEntropyFee: (chainId: number) => Promise<bigint>;
  estimateTaskAssignmentGas: (taskId: string, members: string[], chainId: number) => Promise<bigint>;
  
  // Role management
  hasRole: (role: string, address: string, chainId: number) => Promise<boolean>;
  getAdminRole: (chainId: number) => Promise<string>;
  
  // Task assignment
  assignTaskRandomly: (taskId: string, eligibleMembers: string[], chainId: number, account: string) => Promise<string>;
  
  // Event listening
  watchTaskAssignments: (chainId: number, callback: (event: any) => void) => () => void;
  
  // New method for filtering members by domain
  filterMembersByDomain: (members: Member[], taskType: string) => Member[];
}

class ContractServiceImpl implements ContractService {
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
      
      const gasEstimate = await estimateGas(config, {
        to: contractAddress as `0x${string}`,
        data: `0x${taskId}${members.join('')}${userRandomNumber}`, // Simplified encoding
        chainId
      });

      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return BigInt(100000); // Fallback gas estimate
    }
  }

  async hasRole(role: string, address: string, chainId: number): Promise<boolean> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) return false;

      const roleBytes = ROLE_MAPPING[role as keyof typeof ROLE_MAPPING];
      if (!roleBytes) return false;

      const hasRole = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: PROPOSAL_DECISION_ABI,
        functionName: 'hasRole',
        args: [roleBytes, address as `0x${string}`],
        chainId
      });

      return hasRole as boolean;
    } catch (error) {
      console.error('Failed to check role:', error);
      return false;
    }
  }

  async getAdminRole(chainId: number): Promise<string> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) throw new Error(`Contract not deployed on chain ${chainId}`);

      const adminRole = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: PROPOSAL_DECISION_ABI,
        functionName: 'ADMIN_ROLE',
        chainId
      });

      console.log(`ADMIN_ROLE constant for chain ${chainId}:`, adminRole);
      return adminRole as string;
    } catch (error) {
      console.error('Failed to get ADMIN_ROLE:', error);
      throw error;
    }
  }

  async assignTaskRandomly(taskId: string, eligibleMembers: string[], chainId: number, account: string): Promise<string> {
    try {
      const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!contractAddress) {
        throw new Error(`Contract not deployed on chain ${chainId}`);
      }

      // Get the entropy fee
      const entropyFee = await this.getEntropyFee(chainId);
      
      // Add 15% buffer for gas price fluctuations
      const feeWithBuffer = (entropyFee * BigInt(115)) / BigInt(100);

      // Generate user random number
      const userRandomNumber = keccak256(toBytes(`${taskId}-${Date.now()}-${Math.random()}`));

      console.log('Assigning task with entropy fee:', formatEther(feeWithBuffer), 'ETH');

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

      console.log('Task assignment transaction submitted:', txHash);
      return txHash;
    } catch (error) {
      console.error('Failed to assign task:', error);
      throw error;
    }
  }

  filterMembersByDomain(members: Member[], taskType: string): Member[] {
    const allowedDomains = DOMAIN_MAPPING[taskType as keyof typeof DOMAIN_MAPPING] || ['unassigned'];
    
    const filteredMembers = members.filter(member => 
      member.domain && allowedDomains.includes(member.domain)
    );
    
    // If no members match the domain criteria, fall back to all members
    if (filteredMembers.length === 0) {
      console.warn(`No members found for domain ${taskType}, using all available members`);
      return members;
    }
    
    console.log(`Filtered ${filteredMembers.length} members for ${taskType} domain:`, filteredMembers.map(m => m.domain));
    return filteredMembers;
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

// Export singleton instance
export const contractService = new ContractServiceImpl();

// Utility functions
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
