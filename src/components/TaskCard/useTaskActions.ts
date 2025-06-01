
import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useParams } from 'react-router-dom';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { notificationService } from '@/lib/notificationService';
import { contractService } from '@/lib/contractService';
import type { Member } from '@/lib/memberService';
import { checkDAOMembership } from './taskUtils';

interface Task {
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

export const useTaskActions = (
  task: Task,
  members: Member[],
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { daoId } = useParams();
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
  const [entropyFee, setEntropyFee] = useState<bigint | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleFeeEstimated = (totalFee: bigint, entropy?: bigint, gas?: bigint) => {
    setEstimatedFee(totalFee);
    setEntropyFee(entropy || null);
    setGasEstimate(gas || null);
  };

  const handleOptIn = async () => {
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
        notificationService.notifyTaskUpdate(task.title, 'failed - not a DAO member');
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

  const handleRandomAssignment = async () => {
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

      console.log('TaskCard: Attempting blockchain random assignment...');
      
      // Try blockchain assignment first
      const transactionHash = await contractService.assignTaskRandomly(
        task.id,
        eligibleAddresses,
        chainId,
        address
      );

      setTxHash(transactionHash);
      
      // Only assign if transaction was successful
      const randomMember = filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
      
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        eligibleMembers: eligibleAddresses,
        assignedDelegate: randomMember.address,
        taskDetails: task,
        transactionHash,
        randomnessSource: 'pyth_entropy',
        chainId
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(task.id, { assignee: randomMember.address });
      notificationService.notifyTaskAssignment(task.title, randomMember.name || randomMember.address);
      
      console.log('TaskCard: Random assignment completed successfully:', metadata);
      
    } catch (error) {
      console.error('TaskCard: Blockchain assignment failed:', error);
      
      // Check if error is due to user rejection
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('cancelled')) {
        console.log('TaskCard: User rejected transaction, not assigning task');
        notificationService.notifyTaskUpdate(task.title, 'transaction cancelled');
        setTxHash(null);
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

      await saveToFilecoin(metadata);
      onTaskUpdate?.(task.id, { assignee: randomMember.address });
      notificationService.notifyTaskAssignment(task.title, randomMember.name || randomMember.address);
      
      console.log('TaskCard: Fallback assignment completed:', metadata);
    } finally {
      setIsAssigning(false);
    }
  };

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
    isOptingIn,
    isAssigning,
    estimatedFee,
    entropyFee,
    gasEstimate,
    txHash,
    handleFeeEstimated,
    handleOptIn,
    handleRandomAssignment,
    handleMemberAssignment
  };
};
