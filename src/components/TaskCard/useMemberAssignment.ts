
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { notificationService } from '@/lib/notificationService';
import type { Member } from '@/lib/memberService';
import type { Task } from './types';

export const useMemberAssignment = (
  task: Task,
  members: Member[],
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
) => {
  const handleMemberAssignment = async (memberId: string) => {
    console.log('TaskCard: Member assignment for task:', task.id, 'member:', memberId);
    
    if (!memberId || memberId === "unassigned") {
      onTaskUpdate?.(task.id, { assignee: null });
      notificationService.notifyTaskUpdate(task.title, 'unassigned');
      return;
    }
    
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember) {
      console.error('TaskCard: Selected member not found:', memberId);
      return;
    }

    try {
      const metadata = generateTaskMetadata({
        action: 'delegate_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        delegateAddress: selectedMember.address,
        taskDetails: task
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(task.id, { assignee: selectedMember.address });
      notificationService.notifyTaskAssignment(task.title, selectedMember.name || selectedMember.address);
      
      console.log('TaskCard: Member assigned successfully:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to assign member:', error);
    }
  };

  return {
    handleMemberAssignment
  };
};
