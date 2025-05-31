
import React, { useState } from 'react';
import { TaskColumn } from '@/components/TaskColumn';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';

const initialProposals = {
  todo: [
    {
      id: '1',
      title: 'DAO Constitution Update',
      description: 'Update governance documentation and communication channels',
      assignee: null,
      priority: 'high' as const,
      deadline: '2024-06-15',
      type: 'governance',
      allowsOptIn: true,
      allowsRandomAssignment: false
    },
    {
      id: '2',
      title: 'Treasury Diversification',
      description: 'Execute approved treasury management strategy',
      assignee: null,
      priority: 'medium' as const,
      deadline: '2024-06-20',
      type: 'treasury',
      allowsOptIn: true,
      allowsRandomAssignment: true
    }
  ],
  inProgress: [
    {
      id: '3',
      title: 'Community Events Planning',
      description: 'Organize Q2 community meetups and workshops',
      assignee: 'vitalik.eth',
      priority: 'medium' as const,
      deadline: '2024-06-10',
      type: 'community',
      allowsOptIn: false,
      allowsRandomAssignment: true
    }
  ],
  completed: [
    {
      id: '4',
      title: 'Protocol Upgrade Implementation',
      description: 'Deploy approved smart contract improvements',
      assignee: 'developer.eth',
      priority: 'high' as const,
      deadline: '2024-05-30',
      type: 'technical',
      allowsOptIn: false,
      allowsRandomAssignment: false
    }
  ]
};

export const ProposalBoard = () => {
  const [proposals, setProposals] = useState(initialProposals);

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    const newProposals = { ...proposals };
    
    // Find and update the task
    Object.keys(newProposals).forEach(status => {
      const taskIndex = newProposals[status as keyof typeof newProposals].findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        newProposals[status as keyof typeof newProposals][taskIndex] = {
          ...newProposals[status as keyof typeof newProposals][taskIndex],
          ...updates
        };
      }
    });

    setProposals(newProposals);

    // Generate and save metadata for task update
    const metadata = generateTaskMetadata({
      action: 'task_creation',
      taskId,
      timestamp: new Date().toISOString(),
      taskDetails: { taskId, updates }
    });

    try {
      await saveToFilecoin(metadata);
    } catch (error) {
      console.error('Failed to save task update metadata:', error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskColumn 
          title="To Do" 
          tasks={proposals.todo} 
          status="todo"
          color="from-gray-500 to-gray-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="In Progress" 
          tasks={proposals.inProgress} 
          status="inProgress"
          color="from-blue-500 to-purple-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="Completed" 
          tasks={proposals.completed} 
          status="completed"
          color="from-green-500 to-emerald-600"
          onTaskUpdate={handleTaskUpdate}
        />
      </div>
    </div>
  );
};
