import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, ExternalLink, UserPlus, Check } from 'lucide-react';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import type { Member } from '@/lib/memberService';
import { notificationService } from '@/lib/notificationService';
import { FeeEstimator } from '@/components/FeeEstimator';
import { RandomAssignmentHover } from '@/components/RandomAssignmentHover';
import { contractService } from '@/lib/contractService';
import { useAccount, useChainId } from 'wagmi';
import { useParams } from 'react-router-dom';

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
  members?: Member[];
}

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  members?: Member[];
  status?: string;
}

const priorityColors = {
  low: 'bg-green-500/20 text-green-300 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-300 border-red-500/30'
};

const typeColors = {
  governance: 'bg-purple-500/20 text-purple-300',
  treasury: 'bg-blue-500/20 text-blue-300',
  community: 'bg-pink-500/20 text-pink-300',
  technical: 'bg-cyan-500/20 text-cyan-300',
  grants: 'bg-orange-500/20 text-orange-300',
  operations: 'bg-indigo-500/20 text-indigo-300'
};

// Helper function to check DAO membership
const checkDAOMembership = async (daoId: string, voterAddress: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://membersuri.daostar.org/is_member/${daoId}.eth?voter=${voterAddress}&onchain=${daoId}`);
    const data = await response.json();
    return data.is_member === true;
  } catch (error) {
    console.error('Failed to check DAO membership:', error);
    return false;
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, members = [], status }) => {
  console.log('TaskCard: Rendering with task:', task);
  
  const { address } = useAccount();
  const chainId = useChainId();
  const { daoId } = useParams();
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
  const [entropyFee, setEntropyFee] = useState<bigint | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!task) {
    console.error('TaskCard: task is null or undefined');
    return (
      <Card className="backdrop-blur-lg bg-white/10 border-white/20">
        <CardContent className="p-4">
          <p className="text-gray-400 text-sm">Invalid task data</p>
        </CardContent>
      </Card>
    );
  }

  const safeTask = {
    id: task.id || `task-${Math.random()}`,
    title: task.title || 'Untitled Task',
    description: task.description || 'No description available',
    assignee: task.assignee || null,
    priority: task.priority || 'medium',
    deadline: task.deadline || new Date().toISOString(),
    type: task.type || 'operations',
    allowsOptIn: task.allowsOptIn || false,
    allowsRandomAssignment: task.allowsRandomAssignment || false
  };

  // Check if task is already assigned (either opted in or randomly assigned)
  const isTaskAssigned = !!safeTask.assignee;
  
  // Hide member assignment dropdown for done tasks or tasks that already have an assignee
  const shouldShowMemberAssignment = status !== 'done' && !isTaskAssigned && members && members.length > 0;

  // Hide random assignment button for done tasks or already assigned tasks
  const shouldShowRandomAssignment = status !== 'done' && !isTaskAssigned;

  // Handle fee estimation callback to capture individual fee components
  const handleFeeEstimated = (totalFee: bigint, entropy?: bigint, gas?: bigint) => {
    setEstimatedFee(totalFee);
    setEntropyFee(entropy || null);
    setGasEstimate(gas || null);
  };

  const handleOptIn = async () => {
    console.log('TaskCard: Opt in clicked for task:', safeTask.id);
    
    if (!address) {
      console.error('Wallet not connected');
      return;
    }

    if (!daoId) {
      console.error('DAO ID not found');
      return;
    }

    setIsOptingIn(true);
    
    try {
      // Check if user is a member of the DAO
      const isMember = await checkDAOMembership(daoId, address);
      if (!isMember) {
        console.error('User is not a member of this DAO');
        // You might want to show a toast notification here
        return;
      }

      const metadata = generateTaskMetadata({
        action: 'delegate_opt_in',
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        delegateAddress: address,
        taskDetails: safeTask
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: address });
      
      // Send quirky notification
      notificationService.notifyTaskUpdate(safeTask.title, 'opted in');
      
      console.log('TaskCard: Delegate opted in successfully:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to opt in:', error);
    } finally {
      setIsOptingIn(false);
    }
  };

  const handleRandomAssignment = async () => {
    console.log('TaskCard: Random assignment clicked for task:', safeTask.id);
    setIsAssigning(true);
    setTxHash(null);
    
    try {
      // Filter members by domain before assignment
      const filteredMembers = contractService.filterMembersByDomain(members, safeTask.type);
      const eligibleAddresses = filteredMembers.map(m => m.address).filter(Boolean);
      
      if (eligibleAddresses.length === 0) {
        throw new Error('No eligible members available for this proposal domain');
      }

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Use smart contract for random assignment
      const transactionHash = await contractService.assignTaskRandomly(
        safeTask.id,
        eligibleAddresses,
        chainId,
        address
      );

      setTxHash(transactionHash);
      
      // Select a random member from the filtered pool for immediate UI update
      const randomMember = filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
      
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        eligibleMembers: eligibleAddresses,
        assignedDelegate: randomMember.address, // Fixed: use assignedDelegate instead of assignedMember
        taskDetails: safeTask,
        transactionHash,
        randomnessSource: 'pyth_entropy',
        chainId
      });

      await saveToFilecoin(metadata);
      
      // Update UI immediately with the selected member
      onTaskUpdate?.(safeTask.id, { assignee: randomMember.address });
      
      // Send quirky notification
      notificationService.notifyTaskAssignment(safeTask.title, randomMember.name || randomMember.address);
      
      console.log('TaskCard: Random assignment submitted:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to assign via smart contract:', error);
      
      // Fallback to original logic if smart contract fails
      console.log('TaskCard: Falling back to client-side random assignment');
      const filteredMembers = contractService.filterMembersByDomain(members, safeTask.type);
      const fallbackMembers = filteredMembers.length > 0 ? filteredMembers : members;
      
      const randomMember = fallbackMembers[Math.floor(Math.random() * fallbackMembers.length)];
      
      const metadata = generateTaskMetadata({
        action: 'fallback_assignment',
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        assignedDelegate: randomMember.address,
        taskDetails: safeTask,
        randomnessSource: 'client_fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: randomMember.address });
      
      // Send quirky notification
      notificationService.notifyTaskAssignment(safeTask.title, randomMember.name || randomMember.address);
      
      console.log('TaskCard: Fallback assignment completed:', metadata);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMemberAssignment = async (memberId: string) => {
    console.log('TaskCard: Member assignment for task:', safeTask.id, 'member:', memberId);
    
    if (!memberId || memberId === "unassigned") {
      onTaskUpdate?.(safeTask.id, { assignee: null });
      
      // Send quirky notification for unassignment
      notificationService.notifyTaskUpdate(safeTask.title, 'unassigned');
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
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        delegateAddress: selectedMember.address,
        taskDetails: safeTask
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: selectedMember.address });
      
      // Send quirky notification
      notificationService.notifyTaskAssignment(safeTask.title, selectedMember.name || selectedMember.address);
      
      console.log('TaskCard: Member assigned successfully:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to assign member:', error);
    }
  };

  // Helper function to display assignee (either wallet address or ENS name)
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
    <Card className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-sm font-medium leading-tight line-clamp-2">
            {safeTask.title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          <Badge className={typeColors[safeTask.type as keyof typeof typeColors] || 'bg-gray-500/20 text-gray-300'}>
            {safeTask.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
          {safeTask.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">
              Due: {new Date(safeTask.deadline).toLocaleDateString()}
            </span>
          </div>
          
          {shouldShowMemberAssignment && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Assign Member:</label>
              <Select
                value={safeTask.assignee || "unassigned"}
                onValueChange={handleMemberAssignment}
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
          )}
          
          {safeTask.assignee && (
            <div className="flex items-center text-xs text-gray-400">
              <User className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{displayAssignee(safeTask.assignee)}</span>
              {txHash && (
                <Badge className="ml-2 bg-blue-500/20 text-blue-300 text-xs">
                  TX: {txHash.slice(0, 8)}...
                </Badge>
              )}
            </div>
          )}
          
          {!isTaskAssigned && (
            <div className="flex items-center space-x-2 overflow-hidden">
              {safeTask.allowsOptIn && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleOptIn}
                  disabled={isOptingIn || !address}
                  className="text-xs h-7 bg-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 flex-shrink-0"
                >
                  {isOptingIn ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <UserPlus className="w-3 h-3 mr-1" />
                  )}
                  {isOptingIn ? 'Opting...' : 'Opt In'}
                </Button>
              )}
            </div>
          )}
          
          {shouldShowRandomAssignment && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between overflow-hidden">
                <RandomAssignmentHover
                  isAssigning={isAssigning}
                  estimatedFee={estimatedFee || BigInt(0)}
                  onRandomAssignment={handleRandomAssignment}
                  className="flex-1 min-w-0"
                />
              </div>
              
              {/* Hidden fee estimator to get the fee data */}
              {members && members.length > 0 && (
                <div className="hidden">
                  <FeeEstimator
                    taskId={safeTask.id}
                    eligibleMembers={members.map(m => m.address).filter(Boolean)}
                    onFeeEstimated={handleFeeEstimated}
                  />
                </div>
              )}
              
              {txHash && (
                <p className="text-xs text-green-400 text-center">
                  Transaction submitted: {txHash.slice(0, 12)}...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
