
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Dice6, ExternalLink } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string | null;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  type: string;
}

interface TaskCardProps {
  task: Task;
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

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
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
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-white"
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
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 border-white/20 text-white hover:bg-white/10"
                >
                  Assign
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 border-white/20 text-white hover:bg-white/10"
                >
                  <Dice6 className="w-3 h-3 mr-1" />
                  Random
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
