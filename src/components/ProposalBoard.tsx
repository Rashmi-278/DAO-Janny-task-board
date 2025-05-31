
import React from 'react';
import { TaskColumn } from '@/components/TaskColumn';

const mockProposals = {
  todo: [
    {
      id: '1',
      title: 'DAO Constitution Update',
      description: 'Update governance documentation and communication channels',
      assignee: null,
      priority: 'high' as const,
      deadline: '2024-06-15',
      type: 'governance'
    },
    {
      id: '2',
      title: 'Treasury Diversification',
      description: 'Execute approved treasury management strategy',
      assignee: null,
      priority: 'medium' as const,
      deadline: '2024-06-20',
      type: 'treasury'
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
      type: 'community'
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
      type: 'technical'
    }
  ]
};

export const ProposalBoard = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskColumn 
          title="To Do" 
          tasks={mockProposals.todo} 
          status="todo"
          color="from-gray-500 to-gray-600"
        />
        <TaskColumn 
          title="In Progress" 
          tasks={mockProposals.inProgress} 
          status="inProgress"
          color="from-blue-500 to-purple-600"
        />
        <TaskColumn 
          title="Completed" 
          tasks={mockProposals.completed} 
          status="completed"
          color="from-green-500 to-emerald-600"
        />
      </div>
    </div>
  );
};
