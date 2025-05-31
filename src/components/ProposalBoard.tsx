
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TaskColumn } from '@/components/TaskColumn';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';

interface ProposalsByStatus {
  backlog: Proposal[];
  inProgress: Proposal[];
  review: Proposal[];
  done: Proposal[];
}

export const ProposalBoard = () => {
  const { daoId } = useParams();
  const [proposals, setProposals] = useState<ProposalsByStatus>({
    backlog: [],
    inProgress: [],
    review: [],
    done: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      if (!daoId) return;
      
      setLoading(true);
      try {
        const fetchedProposals = await fetchDAOProposals(daoId);
        
        // Group proposals by workflow status
        const groupedProposals: ProposalsByStatus = {
          backlog: fetchedProposals.filter(p => p.status === 'onchain'),
          inProgress: fetchedProposals.filter(p => p.status === 'approved'),
          review: [], // Can be populated with proposals pending review
          done: fetchedProposals.filter(p => p.status === 'closed')
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
              backlog: groupedProposals.backlog.length,
              inProgress: groupedProposals.inProgress.length,
              review: groupedProposals.review.length,
              done: groupedProposals.done.length
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
    // Handle proposal updates
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TaskColumn 
          title="Backlog" 
          tasks={proposals.backlog.map(p => ({
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
          status="backlog"
          color="from-gray-500 to-gray-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="In Progress" 
          tasks={proposals.inProgress.map(p => ({
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
          status="inProgress"
          color="from-blue-500 to-blue-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="Review" 
          tasks={proposals.review.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: p.author,
            priority: 'medium' as const,
            deadline: p.deadline || p.created,
            type: p.category,
            allowsOptIn: false,
            allowsRandomAssignment: false
          }))} 
          status="review"
          color="from-yellow-500 to-yellow-600"
          onTaskUpdate={handleTaskUpdate}
        />
        <TaskColumn 
          title="Done" 
          tasks={proposals.done.map(p => ({
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
          status="done"
          color="from-green-500 to-green-600"
          onTaskUpdate={handleTaskUpdate}
        />
      </div>
    </div>
  );
};
