
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Dice6, ExternalLink, UserPlus, Check } from 'lucide-react';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';

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

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
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
  technical: 'bg-cyan-500/20 text-cyan-300'
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate }) => {
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
      // Generate random delegate (in real app, this would use Pyth Entropy API)
      const randomDelegates = ['alice.eth', 'bob.eth', 'charlie.eth', 'diana.eth'];
      const randomDelegate = randomDelegates[Math.floor(Math.random() * randomDelegates.length)];
      
      // Generate metadata for random assignment
      const metadata = generateTaskMetadata({
        action: 'random_assignment',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        assignedDelegate: randomDelegate,
        taskDetails: task,
        randomnessSource: 'pyth_entropy' // Would be actual entropy data
      });

      // Save metadata to Filecoin
      await saveToFilecoin(metadata);

      // Update task with random assignee
      onTaskUpdate?.(task.id, { assignee: randomDelegate });
      
      console.log('Random assignment completed:', metadata);
    } catch (error) {
      console.error('Failed to assign randomly:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-sm font-medium leading-tight">
            {task.title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
          <Badge className={typeColors[task.type as keyof typeof typeColors] || 'bg-gray-500/20 text-gray-300'}>
            {task.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-xs leading-relaxed">
          {task.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3 h-3 mr-2" />
            Due: {new Date(task.deadline).toLocaleDateString()}
          </div>
          
          <div className="flex items-center justify-between">
            {task.assignee ? (
              <div className="flex items-center text-xs text-gray-400">
                <User className="w-3 h-3 mr-2" />
                {task.assignee}
              </div>
            ) : (
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
