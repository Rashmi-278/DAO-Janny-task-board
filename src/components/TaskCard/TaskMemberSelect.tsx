
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Member } from '@/lib/memberService';

interface TaskMemberSelectProps {
  assignee: string | null;
  members: Member[];
  onMemberAssignment: (memberId: string) => void;
}

export const TaskMemberSelect: React.FC<TaskMemberSelectProps> = ({
  assignee,
  members,
  onMemberAssignment
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400">Assign Member:</label>
      <Select
        value={assignee || "unassigned"}
        onValueChange={onMemberAssignment}
      >
        <SelectTrigger className="h-7 text-xs bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Select member" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-white/20 z-50">
          <SelectItem value="unassigned" className="text-white hover:bg-white/10">
            Unassigned
          </SelectItem>
          {members.slice(0, 10).map((member) => (
            <SelectItem 
              key={member.id} 
              value={member.id} 
              className="text-white hover:bg-white/10"
            >
              <div className="flex flex-col">
                <span className="truncate">{member.name || 'Unknown'}</span>
                <span className="text-xs text-gray-400 truncate">
                  {member.address ? `${member.address.slice(0, 6)}...${member.address.slice(-4)}` : 'No address'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
