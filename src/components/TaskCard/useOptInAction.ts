
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { notificationService } from '@/lib/notificationService';
import { checkDAOMembership } from './taskUtils';
import type { Task } from './types';

export const useOptInAction = (
  task: Task,
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
) => {
  const { daoId } = useParams();
  const [isOptingIn, setIsOptingIn] = useState(false);

  const handleOptIn = async (address: string) => {
    console.log('TaskCard: Opt in clicked for task:', task.id);
    
    if (!address) {
      console.error('Wallet not connected');
      notificationService.notifyTaskUpdate(task.title, 'failed - wallet not connected');
      return;
    }

    if (!daoId) {
      console.error('DAO ID not found');
      notificationService.notifyTaskUpdate(task.title, 'failed - DAO not found');
      return;
    }

    setIsOptingIn(true);
    
    try {
      // Check DAO membership before allowing opt-in
      const isMember = await checkDAOMembership(daoId, address);
      if (!isMember) {
        console.error('User is not a member of this DAO');
        notificationService.notifyTaskUpdate(task.title, 'failed - you are not a DAO member');
        return;
      }

      const metadata = generateTaskMetadata({
        action: 'delegate_opt_in',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        delegateAddress: address,
        taskDetails: task
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(task.id, { assignee: address });
      
      notificationService.notifyTaskUpdate(task.title, 'opted in successfully');
      
      console.log('TaskCard: Delegate opted in successfully:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to opt in:', error);
      notificationService.notifyTaskUpdate(task.title, 'failed to opt in');
    } finally {
      setIsOptingIn(false);
    }
  };

  return {
    isOptingIn,
    handleOptIn
  };
};
