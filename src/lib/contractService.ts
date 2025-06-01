
import type { Member } from './memberService';
import type { ContractService } from './contract/types';
import { FeeService } from './contract/feeService';
import { RoleService } from './contract/roleService';
import { TaskAssignmentService } from './contract/taskAssignmentService';
import { MemberFilterService } from './contract/memberFilterService';

// Re-export ABIs and constants for backward compatibility
export { PROPOSAL_DECISION_ABI, PYTH_ENTROPY_ABI } from './contract/abis';
export { CONTRACT_ROLES, ROLE_MAPPING, DOMAIN_MAPPING } from './contract/constants';
export { formatFeeEstimate, getRoleFromCategory } from './contract/utils';

class ContractServiceImpl implements ContractService {
  private feeService: FeeService;
  private roleService: RoleService;
  private taskAssignmentService: TaskAssignmentService;
  private memberFilterService: MemberFilterService;

  constructor() {
    this.feeService = new FeeService();
    this.roleService = new RoleService();
    this.taskAssignmentService = new TaskAssignmentService();
    this.memberFilterService = new MemberFilterService();
  }

  async getEntropyFee(chainId: number): Promise<bigint> {
    return this.feeService.getEntropyFee(chainId);
  }

  async estimateTaskAssignmentGas(taskId: string, members: string[], chainId: number): Promise<bigint> {
    return this.feeService.estimateTaskAssignmentGas(taskId, members, chainId);
  }

  async hasRole(role: string, address: string, chainId: number): Promise<boolean> {
    return this.roleService.hasRole(role, address, chainId);
  }

  async getAdminRole(chainId: number): Promise<string> {
    return this.roleService.getAdminRole(chainId);
  }

  async assignTaskRandomly(taskId: string, eligibleMembers: string[], chainId: number, account: string): Promise<string> {
    return this.taskAssignmentService.assignTaskRandomly(taskId, eligibleMembers, chainId, account);
  }

  filterMembersByDomain(members: Member[], taskType: string): Member[] {
    return this.memberFilterService.filterMembersByDomain(members, taskType);
  }

  watchTaskAssignments(chainId: number, callback: (event: any) => void): () => void {
    return this.taskAssignmentService.watchTaskAssignments(chainId, callback);
  }
}

// Export singleton instance
export const contractService = new ContractServiceImpl();
