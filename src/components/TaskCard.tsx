
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

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, members = [] }) => {
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleOptIn = async () => {
    setIsOptingIn(true);
    
    try {
      // Generate metadata for opt-in action
      const metadata = generateTaskMetadata({
        action: 'delegate_opt_in',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        delegateAddress: 'user.eth', // This would come from wallet connection
        taskDetails: task
      });

      // Save metadata to Filecoin
      await saveToFilecoin(metadata);

      // Update task with assignee
      onTaskUpdate?.(task.id, { assignee: 'user.eth' });
      
      console.log('Delegate opted in successfully:', metadata);
    } catch (error) {
      console.error('Failed to opt in:', error);
    } finally {
      setIsOptingIn(false);
    }
  };

  const handleRandomAssignment = async () => {
    setIsAssigning(true);
    
    try {
      // Use actual members if available, otherwise fallback to mock data
      const availableMembers = members.length > 0 
        ? members.map(m => m.address)
        : ['alice.eth', 'bob.eth', 'charlie.eth', 'diana.eth'];
      
      const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      
      // Generate metadata for random assignment
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        assignedDelegate: randomMember,
        taskDetails: task,
        randomnessSource: 'pyth_entropy' // Would be actual entropy data
      });

      // Save metadata to Filecoin
      await saveToFilecoin(metadata);

      // Update task with random assignee
      onTaskUpdate?.(task.id, { assignee: randomMember });
      
      console.log('Random assignment completed:', metadata);
    } catch (error) {
      console.error('Failed to assign randomly:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMemberAssignment = async (memberId: string) => {
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember) return;

    try {
      const metadata = generateTaskMetadata({
        action: 'delegate_opt_in',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        delegateAddress: selectedMember.address,
        taskDetails: { ...task, assignedMember: selectedMember }
      });

      await saveToFilecoin(metadata);
      onTaskUpdate?.(task.id, { assignee: selectedMember.address });
      
      console.log('Member assigned successfully:', metadata);
    } catch (error) {
      console.error('Failed to assign member:', error);
    }
  };

  return (
    <Card className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-sm font-medium leading-tight line-clamp-2">
            {task.title}
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
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
          <Badge className={typeColors[task.type as keyof typeof typeColors] || 'bg-gray-500/20 text-gray-300'}>
            {task.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
          {task.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">Due: {new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          
          {/* Member Assignment Section */}
          {members.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Assign Member:</label>
              <Select
                value={task.assignee || ""}
                onValueChange={handleMemberAssignment}
              >
                <SelectTrigger className="h-7 text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20 z-50">
                  <SelectItem value="" className="text-white hover:bg-white/10">
                    Unassigned
                  </SelectItem>
                  {members.slice(0, 10).map((member) => (
                    <SelectItem 
                      key={member.id} 
                      value={member.id} 
                      className="text-white hover:bg-white/10"
                    >
                      <div className="flex flex-col">
                        <span className="truncate">{member.name}</span>
                        <span className="text-xs text-gray-400 truncate">
                          {member.address.slice(0, 6)}...{member.address.slice(-4)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Current Assignee Display */}
          {task.assignee && (
            <div className="flex items-center text-xs text-gray-400">
              <User className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{task.assignee}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          {!task.assignee && (
            <div className="flex items-center space-x-2">
              {task.allowsOptIn && (
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
              {task.allowsRandomAssignment && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRandomAssignment}
                  disabled={isAssigning}
                  className="text-xs h-7 border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
                >
                  <Dice6 className="w-3 h-3 mr-1" />
                  {isAssigning ? 'Assigning...' : 'Random'}
                </Button>
              )}
            </div>
          )}
          
          {/* Random Assignment Button - Always visible */}
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
        </div>
      </CardContent>
    </Card>
  );
};
