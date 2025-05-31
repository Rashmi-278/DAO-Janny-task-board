import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Dice6, ExternalLink, UserPlus, Check } from 'lucide-react';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import type { Member } from '@/lib/memberService';

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

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, members = [], status }) => {
  console.log('TaskCard: Rendering with task:', task);
  
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

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

  // Hide member assignment dropdown for done tasks or tasks that already have an assignee
  const shouldShowMemberAssignment = status !== 'done' && !safeTask.assignee && members && members.length > 0;

  // Hide random assignment button for done tasks
  const shouldShowRandomAssignment = status !== 'done';

  const handleOptIn = async () => {
    console.log('TaskCard: Opt in clicked for task:', safeTask.id);
    setIsOptingIn(true);
    
    try {
      const metadata = generateTaskMetadata({
        action: 'delegate_opt_in',
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        delegateAddress: 'user.eth',
        taskDetails: safeTask
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: 'user.eth' });
      
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
    
    try {
      const availableMembers = members && members.length > 0 
        ? members.map(m => m.address).filter(Boolean)
        : ['alice.eth', 'bob.eth', 'charlie.eth', 'diana.eth'];
      
      const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: safeTask.id,
        timestamp: new Date().toISOString(),
        assignedDelegate: randomMember,
        taskDetails: safeTask,
        randomnessSource: 'pyth_entropy'
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: randomMember });
      
      console.log('TaskCard: Random assignment completed:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to assign randomly:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMemberAssignment = async (memberId: string) => {
    console.log('TaskCard: Member assignment for task:', safeTask.id, 'member:', memberId);
    
    if (!memberId || memberId === "unassigned") {
      onTaskUpdate?.(safeTask.id, { assignee: null });
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
        taskDetails: { ...safeTask, assignedMember: selectedMember }
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(safeTask.id, { assignee: selectedMember.address });
      
      console.log('TaskCard: Member assigned successfully:', metadata);
    } catch (error) {
      console.error('TaskCard: Failed to assign member:', error);
    }
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
          <Badge className={priorityColors[safeTask.priority as keyof typeof priorityColors] || priorityColors.medium}>
            {safeTask.priority}
          </Badge>
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
              <span className="truncate">{safeTask.assignee}</span>
            </div>
          )}
          
          {!safeTask.assignee && (
            <div className="flex items-center space-x-2">
              {safeTask.allowsOptIn && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleOptIn}
                  disabled={isOptingIn}
                  className="text-xs h-7 border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
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
            <div className="pt-2 border-t border-white/10">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRandomAssignment}
                disabled={isAssigning}
                className="w-full text-xs h-7 border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
              >
                <Dice6 className="w-3 h-3 mr-1" />
                {isAssigning ? 'Randomly Assigning...' : 'Random Assignment'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
