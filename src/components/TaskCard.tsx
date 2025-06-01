
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import type { Member } from '@/lib/memberService';
import { TaskAssigneeDisplay } from './TaskCard/TaskAssigneeDisplay';
import { TaskOptInButton } from './TaskCard/TaskOptInButton';
import { TaskMemberSelect } from './TaskCard/TaskMemberSelect';
import { TaskRandomAssignment } from './TaskCard/TaskRandomAssignment';
import { useTaskActions } from './TaskCard/useTaskActions';
import { typeColors, createSafeTask } from './TaskCard/taskUtils';
import { useAccount } from 'wagmi';

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

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, members = [], status }) => {
  console.log('TaskCard: Rendering with task:', task);
  const { address } = useAccount();

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

  const safeTask = createSafeTask(task);
  
  const {
    isOptingIn,
    isAssigning,
    estimatedFee,
    txHash,
    handleFeeEstimated,
    handleOptIn,
    handleRandomAssignment,
    handleMemberAssignment
  } = useTaskActions(safeTask, members, onTaskUpdate);

  // Check if task is already assigned (either opted in or randomly assigned)
  const isTaskAssigned = !!safeTask.assignee;
  
  // Hide member assignment dropdown for done tasks or tasks that already have an assignee
  const shouldShowMemberAssignment = status !== 'done' && !isTaskAssigned && members && members.length > 0;

  // Hide random assignment button for done tasks or already assigned tasks
  const shouldShowRandomAssignment = status !== 'done' && !isTaskAssigned;

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
            <TaskMemberSelect
              assignee={safeTask.assignee}
              members={members}
              onMemberAssignment={handleMemberAssignment}
            />
          )}
          
          {safeTask.assignee && (
            <TaskAssigneeDisplay
              assignee={safeTask.assignee}
              address={address}
              members={members}
              txHash={txHash}
            />
          )}
          
          {!isTaskAssigned && (
            <div className="flex items-center space-x-2 overflow-hidden">
              {safeTask.allowsOptIn && (
                <TaskOptInButton
                  isOptingIn={isOptingIn}
                  address={address}
                  onOptIn={handleOptIn}
                />
              )}
            </div>
          )}
          
          {shouldShowRandomAssignment && (
            <TaskRandomAssignment
              taskId={safeTask.id}
              members={members}
              isAssigning={isAssigning}
              estimatedFee={estimatedFee}
              txHash={txHash}
              onRandomAssignment={handleRandomAssignment}
              onFeeEstimated={handleFeeEstimated}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
