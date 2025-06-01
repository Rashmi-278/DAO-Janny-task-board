
import type { Member } from '@/lib/memberService';

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
