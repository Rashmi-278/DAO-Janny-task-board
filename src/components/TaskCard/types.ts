
export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string | null;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  type: string;
  allowsOptIn?: boolean;
  allowsRandomAssignment?: boolean;
}

export interface TaskActionState {
  isOptingIn: boolean;
  isAssigning: boolean;
  estimatedFee: bigint | null;
  entropyFee: bigint | null;
  gasEstimate: bigint | null;
  txHash: string | null;
}

export interface TaskActionCallbacks {
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onFeeEstimated: (totalFee: bigint, entropy?: bigint, gas?: bigint) => void;
}
