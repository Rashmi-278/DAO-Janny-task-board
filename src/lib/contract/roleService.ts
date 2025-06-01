
import { readContract } from 'wagmi/actions';
import { CONTRACT_ADDRESSES, config } from '../Web3Provider';
import { PROPOSAL_DECISION_ABI } from './abis';
import { ROLE_MAPPING } from './constants';

export class RoleService {
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
}
