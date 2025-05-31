
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TaskColumn } from '@/components/TaskColumn';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';

interface ProposalsByStatus {
  onchain: Proposal[];
  closed: Proposal[];
  approved: Proposal[];
}

export const ProposalBoard = () => {
  const { daoId } = useParams();
  const [proposals, setProposals] = useState<ProposalsByStatus>({
    onchain: [],
    closed: [],
    approved: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      if (!daoId) return;
      
      setLoading(true);
      try {
        const fetchedProposals = await fetchDAOProposals(daoId);
        
        // Group proposals by status
        const groupedProposals: ProposalsByStatus = {
          onchain: fetchedProposals.filter(p => p.status === 'onchain'),
          closed: fetchedProposals.filter(p => p.status === 'closed'),
          approved: fetchedProposals.filter(p => p.status === 'approved')
        };
        
        setProposals(groupedProposals);
        
        // Generate metadata for proposal fetch
        const metadata = generateTaskMetadata({
          action: 'task_creation',
          taskId: `${daoId}-proposals-fetch`,
          timestamp: new Date().toISOString(),
          taskDetails: {
            daoId,
            proposalCounts: {
              onchain: groupedProposals.onchain.length,
              closed: groupedProposals.closed.length,
              approved: groupedProposals.approved.length
            }
          }
        });
        
        await saveToFilecoin(metadata);
        
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [daoId]);

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    // Handle proposal updates - for now just log
    console.log('Proposal update:', taskId, updates);
    
    // Generate metadata for proposal update
    const metadata = generateTaskMetadata({
      action: 'task_creation',
      taskId,
      timestamp: new Date().toISOString(),
      taskDetails: { taskId, updates }
    });

    try {
      await saveToFilecoin(metadata);
    } catch (error) {
      console.error('Failed to save proposal update metadata:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading proposals...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskColumn 
          title="Onchain" 
          tasks={proposals.onchain.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: null,
            priority: 'medium' as const,
            deadline: p.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: p.category,
            allowsOptIn: true,
            allowsRandomAssignment: false
          }))} 
          status="onchain"
          color="from-blue-500 to-blue-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="Closed" 
          tasks={proposals.closed.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: p.author,
            priority: 'low' as const,
            deadline: p.deadline || p.created,
            type: p.category,
            allowsOptIn: false,
            allowsRandomAssignment: false
          }))} 
          status="closed"
          color="from-red-500 to-red-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="Approved" 
          tasks={proposals.approved.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: null,
            priority: 'high' as const,
            deadline: p.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            type: p.category,
            allowsOptIn: true,
            allowsRandomAssignment: true
          }))} 
          status="approved"
          color="from-green-500 to-emerald-600"
          onTaskUpdate={handleTaskUpdate}
        />
      </div>
    </div>
  );
};
