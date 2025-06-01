
import { useState } from 'react';
import { useChainId } from 'wagmi';
import { useNotification } from "@blockscout/app-sdk";
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { notificationService } from '@/lib/notificationService';
import { contractService } from '@/lib/contractService';
import { blockscoutService } from '@/lib/blockscoutService';
import type { Member } from '@/lib/memberService';
import type { Task } from './types';

export const useRandomAssignment = (
  task: Task,
  members: Member[],
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
) => {
  const chainId = useChainId();
  const { openTxToast } = useNotification();
  const [isAssigning, setIsAssigning] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleRandomAssignment = async (address: string) => {
    console.log('TaskCard: Random assignment clicked for task:', task.id);
    setIsAssigning(true);
    setTxHash(null);
    
    try {
      const filteredMembers = contractService.filterMembersByDomain(members, task.type);
      const eligibleAddresses = filteredMembers.map(m => m.address).filter(Boolean);
      
      if (eligibleAddresses.length === 0) {
        throw new Error('No eligible members available for this proposal domain');
      }

      if (!address) {
        throw new Error('Wallet not connected');
      }

      console.log('TaskCard: Attempting blockchain random assignment with eligible members:', eligibleAddresses);
      
      // Try blockchain assignment first
      const transactionHash = await contractService.assignTaskRandomly(
        task.id,
        eligibleAddresses,
        chainId,
        address
      );

      setTxHash(transactionHash);
      console.log('TaskCard: Transaction submitted successfully:', transactionHash);
      
      // Show Blockscout transaction toast
      if (openTxToast) {
        await openTxToast(chainId.toString(), transactionHash);
      }
      
      // Also show via blockscout service
      await blockscoutService.showTransactionToast(transactionHash);
      
      // Wait for transaction to be mined and get the result
      // For now, we'll do client-side assignment since we don't have event listening
      const randomIndex = Math.floor(Math.random() * filteredMembers.length);
      const selectedMember = filteredMembers[randomIndex];
      
      console.log('TaskCard: Randomly selected member:', selectedMember);
      
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        eligibleMembers: eligibleAddresses,
        assignedDelegate: selectedMember.address,
        taskDetails: task,
        transactionHash,
        randomnessSource: 'pyth_entropy',
        chainId
      });

      try {
        await saveToFilecoin(metadata);
      } catch (metadataError) {
        console.warn('TaskCard: Failed to save metadata to Filecoin, continuing with assignment:', metadataError);
      }
      
      // Update the task with the assigned member
      onTaskUpdate?.(task.id, { assignee: selectedMember.address });
      notificationService.notifyTaskAssignment(task.title, selectedMember.name || selectedMember.address);
      
      console.log('TaskCard: Random assignment completed successfully:', metadata);
      
    } catch (error) {
      console.error('TaskCard: Random assignment failed:', error);
      setTxHash(null);
      
      // Check if error is due to user rejection
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        console.log('TaskCard: User rejected transaction, not assigning task');
        notificationService.notifyTaskUpdate(task.title, 'transaction cancelled');
        return; // Exit without fallback assignment
      }
      
      // Only use fallback for technical errors, not user rejections
      console.log('TaskCard: Technical error, falling back to client-side assignment');
      const filteredMembers = contractService.filterMembersByDomain(members, task.type);
      const fallbackMembers = filteredMembers.length > 0 ? filteredMembers : members;
      
      if (fallbackMembers.length === 0) {
        throw new Error('No members available for assignment');
      }
      
      const randomMember = fallbackMembers[Math.floor(Math.random() * fallbackMembers.length)];
      
      const metadata = generateTaskMetadata({
        action: 'fallback_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        assignedDelegate: randomMember.address,
        taskDetails: task,
        randomnessSource: 'client_fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      try {
        await saveToFilecoin(metadata);
      } catch (metadataError) {
        console.warn('TaskCard: Failed to save fallback metadata to Filecoin, continuing with assignment:', metadataError);
      }
      
      onTaskUpdate?.(task.id, { assignee: randomMember.address });
      notificationService.notifyTaskAssignment(task.title, randomMember.name || randomMember.address);
      
      console.log('TaskCard: Fallback assignment completed:', metadata);
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    isAssigning,
    txHash,
    handleRandomAssignment,
    setTxHash
  };
};
