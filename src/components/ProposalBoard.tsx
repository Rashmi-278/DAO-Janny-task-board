
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TaskColumn } from '@/components/TaskColumn';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';
import { fetchDAOMembers, type Member } from '@/lib/memberService';

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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!daoId) {
        setError('No DAO ID provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading data for DAO:', daoId);
        
        const [fetchedProposals, fetchedMembers] = await Promise.all([
          fetchDAOProposals(daoId),
          fetchDAOMembers(daoId)
        ]);
        
        console.log('Fetched proposals:', fetchedProposals);
        console.log('Fetched members:', fetchedMembers);
        
        if (!fetchedProposals || fetchedProposals.length === 0) {
          console.log('No proposals found for DAO:', daoId);
          setProposals({
            backlog: [],
            inProgress: [],
            review: [],
            done: []
          });
          setMembers(fetchedMembers || []);
          setLoading(false);
          return;
        }
        
        const shuffled = [...fetchedProposals].sort(() => 0.5 - Math.random());
        const quarterSize = Math.ceil(shuffled.length / 4);
        
        const groupedProposals: ProposalsByStatus = {
          backlog: shuffled.slice(0, quarterSize),
          inProgress: shuffled.slice(quarterSize, quarterSize * 2),
          review: shuffled.slice(quarterSize * 2, quarterSize * 3),
          done: shuffled.slice(quarterSize * 3)
        };
        
        setProposals(groupedProposals);
        setMembers(fetchedMembers || []);
        
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
        console.error('Failed to load data:', error);
        setError('Failed to load proposals and members');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [daoId]);

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    console.log('Proposal update:', taskId, updates);
    
    if (updates.assignee) {
      setProposals(prev => {
        const newProposals = { ...prev };
        for (const status in newProposals) {
          const statusKey = status as keyof ProposalsByStatus;
          newProposals[statusKey] = newProposals[statusKey].map(proposal => 
            proposal.id === taskId ? { ...proposal, assignee: updates.assignee } : proposal
          );
        }
        return newProposals;
      });
    }
    
    try {
      const metadata = generateTaskMetadata({
        action: 'task_creation',
        taskId,
        timestamp: new Date().toISOString(),
        taskDetails: { taskId, updates }
      });

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

  if (error) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
      <p className="text-gray-300 mb-6">
        Manage proposal execution workflow. All proposals shown are closed (voting period ended).
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TaskColumn 
          title="Backlog" 
          tasks={proposals.backlog.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: (p as any).assignee || null,
            priority: 'medium' as const,
            deadline: p.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: p.category,
            allowsOptIn: true,
            allowsRandomAssignment: false,
            members: members
          }))} 
          status="backlog"
          color="from-gray-500 to-gray-600"
          onTaskUpdate={handleTaskUpdate}
          members={members}
        />
        <TaskColumn 
          title="In Progress" 
          tasks={proposals.inProgress.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: (p as any).assignee || null,
            priority: 'high' as const,
            deadline: p.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            type: p.category,
            allowsOptIn: true,
            allowsRandomAssignment: true,
            members: members
          }))} 
          status="inProgress"
          color="from-blue-500 to-blue-600"
          onTaskUpdate={handleTaskUpdate}
          members={members}
        />
        <TaskColumn 
          title="Review" 
          tasks={proposals.review.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: (p as any).assignee || null,
            priority: 'medium' as const,
            deadline: p.deadline || p.created,
            type: p.category,
            allowsOptIn: false,
            allowsRandomAssignment: false,
            members: members
          }))} 
          status="review"
          color="from-yellow-500 to-yellow-600"
          onTaskUpdate={handleTaskUpdate}
          members={members}
        />
        <TaskColumn 
          title="Done" 
          tasks={proposals.done.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            assignee: (p as any).assignee || null,
            priority: 'low' as const,
            deadline: p.deadline || p.created,
            type: p.category,
            allowsOptIn: false,
            allowsRandomAssignment: false,
            members: members
          }))} 
          status="done"
          color="from-green-500 to-green-600"
          onTaskUpdate={handleTaskUpdate}
          members={members}
        />
      </div>
    </div>
  );
};
