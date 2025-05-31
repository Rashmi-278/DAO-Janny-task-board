
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TaskCard } from '@/components/TaskCard';
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

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  color: string;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  members?: Member[];
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ 
  title, 
  tasks, 
  status,
  onTaskUpdate, 
  members = [] 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <span className="px-2 py-1 text-xs rounded-full bg-white/20 text-white">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onTaskUpdate={onTaskUpdate}
            members={members}
            status={status}
          />
        ))}
        
        {tasks.length === 0 && (
          <Card className="backdrop-blur-lg bg-white/5 border-white/10 border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-400 text-sm">No tasks yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
