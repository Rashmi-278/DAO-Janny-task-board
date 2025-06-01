
import React from 'react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Member } from '@/lib/memberService';

interface TaskAssigneeDisplayProps {
  assignee: string;
  address?: string;
  members: Member[];
  txHash?: string | null;
}

export const TaskAssigneeDisplay: React.FC<TaskAssigneeDisplayProps> = ({
  assignee,
  address,
  members,
  txHash
}) => {
  const displayAssignee = (assigneeAddress: string) => {
    // If it's the connected wallet, show a truncated version
    if (assigneeAddress === address) {
      return `${assigneeAddress.slice(0, 6)}...${assigneeAddress.slice(-4)} (You)`;
    }
    
    // For other addresses, try to find the member name or show truncated address
    const member = members.find(m => m.address === assigneeAddress);
    if (member && member.name) {
      return member.name;
    }
    
    return `${assigneeAddress.slice(0, 6)}...${assigneeAddress.slice(-4)}`;
  };

  return (
    <div className="flex items-center text-xs text-gray-400">
      <User className="w-3 h-3 mr-2 flex-shrink-0" />
      <span className="truncate">{displayAssignee(assignee)}</span>
      {txHash && (
        <Badge className="ml-2 bg-blue-500/20 text-blue-300 text-xs">
          TX: {txHash.slice(0, 8)}...
        </Badge>
      )}
    </div>
  );
};
