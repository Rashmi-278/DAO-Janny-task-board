
import React from 'react';
import { RandomAssignmentHover } from '@/components/RandomAssignmentHover';
import { FeeEstimator } from '@/components/FeeEstimator';
import type { Member } from '@/lib/memberService';

interface TaskRandomAssignmentProps {
  taskId: string;
  members: Member[];
  isAssigning: boolean;
  estimatedFee: bigint | null;
  txHash: string | null;
  onRandomAssignment: () => void;
  onFeeEstimated: (totalFee: bigint, entropy?: bigint, gas?: bigint) => void;
}

export const TaskRandomAssignment: React.FC<TaskRandomAssignmentProps> = ({
  taskId,
  members,
  isAssigning,
  estimatedFee,
  txHash,
  onRandomAssignment,
  onFeeEstimated
}) => {
  return (
    <div className="pt-2 border-t border-white/10 space-y-2">
      <div className="flex items-center justify-between overflow-hidden">
        <RandomAssignmentHover
          isAssigning={isAssigning}
          estimatedFee={estimatedFee || BigInt(0)}
          onRandomAssignment={onRandomAssignment}
          className="flex-1 min-w-0"
        />
      </div>
      
      {/* Hidden fee estimator to get the fee data */}
      {members && members.length > 0 && (
        <div className="hidden">
          <FeeEstimator
            taskId={taskId}
            eligibleMembers={members.map(m => m.address).filter(Boolean)}
            onFeeEstimated={onFeeEstimated}
          />
        </div>
      )}
      
      {txHash && (
        <p className="text-xs text-green-400 text-center">
          Transaction submitted: {txHash.slice(0, 12)}...
        </p>
      )}
    </div>
  );
};
