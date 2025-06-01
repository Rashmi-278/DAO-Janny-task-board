
import { useAccount } from 'wagmi';
import type { Member } from '@/lib/memberService';
import { useOptInAction } from './useOptInAction';
import { useRandomAssignment } from './useRandomAssignment';
import { useMemberAssignment } from './useMemberAssignment';
import { useFeeState } from './useFeeState';
import type { Task } from './types';

export const useTaskActions = (
  task: Task,
  members: Member[],
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
) => {
  const { address } = useAccount();
  
  const { isOptingIn, handleOptIn } = useOptInAction(task, onTaskUpdate);
  const { isAssigning, txHash, handleRandomAssignment, setTxHash } = useRandomAssignment(task, members, onTaskUpdate);
  const { handleMemberAssignment } = useMemberAssignment(task, members, onTaskUpdate);
  const { estimatedFee, entropyFee, gasEstimate, handleFeeEstimated } = useFeeState();

  const wrappedOptIn = () => {
    if (address) {
      handleOptIn(address);
    }
  };

  const wrappedRandomAssignment = () => {
    if (address) {
      handleRandomAssignment(address);
    }
  };

  return {
    isOptingIn,
    isAssigning,
    estimatedFee,
    entropyFee,
    gasEstimate,
    txHash,
    handleFeeEstimated,
    handleOptIn: wrappedOptIn,
    handleRandomAssignment: wrappedRandomAssignment,
    handleMemberAssignment
  };
};
