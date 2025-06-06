
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
  console.log('ProposalBoard: Component rendering started');
  
  const { daoId } = useParams();
  console.log('ProposalBoard: daoId from params:', daoId);
  
  const [proposals, setProposals] = useState<ProposalsByStatus>({
    backlog: [],
    inProgress: [],
    review: [],
    done: []
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo member addresses for pre-assignment
  const demoAssignees = [
    'alice.eth',
    'bob.eth', 
    'charlie.eth',
    'diana.eth',
    'eve.eth'
  ];

  useEffect(() => {
    console.log('ProposalBoard: useEffect triggered, daoId:', daoId);
    
    const loadData = async () => {
      try {
        console.log('ProposalBoard: Starting loadData function');
        
        if (!daoId) {
          console.log('ProposalBoard: No DAO ID provided');
          setError('No DAO ID provided');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        console.log('ProposalBoard: Set loading to true, starting data fetch for DAO:', daoId);
        
        const [fetchedProposals, fetchedMembers] = await Promise.all([
          fetchDAOProposals(daoId),
          fetchDAOMembers(daoId)
        ]);
        
        console.log('ProposalBoard: Fetched proposals:', fetchedProposals);
        console.log('ProposalBoard: Fetched members:', fetchedMembers);
        
        // Ensure we have arrays
        const validProposals = Array.isArray(fetchedProposals) ? fetchedProposals : [];
        const validMembers = Array.isArray(fetchedMembers) ? fetchedMembers : [];
        
        console.log('ProposalBoard: Valid proposals length:', validProposals.length);
        console.log('ProposalBoard: Valid members length:', validMembers.length);
        
        if (validProposals.length === 0) {
          console.log('ProposalBoard: No proposals found, setting empty state');
          setProposals({
            backlog: [],
            inProgress: [],
            review: [],
            done: []
          });
          setMembers(validMembers);
          setLoading(false);
          return;
        }
        
        // Better distribution for demo purposes
        const shuffled = [...validProposals].sort(() => 0.5 - Math.random());
        
        // Distribute with more emphasis on backlog and in-progress for demo
        const totalCount = shuffled.length;
        const backlogCount = Math.ceil(totalCount * 0.4); // 40% in backlog
        const inProgressCount = Math.ceil(totalCount * 0.3); // 30% in progress
        const reviewCount = Math.ceil(totalCount * 0.2); // 20% in review
        const doneCount = totalCount - backlogCount - inProgressCount - reviewCount; // remainder in done
        
        const groupedProposals: ProposalsByStatus = {
          backlog: shuffled.slice(0, backlogCount),
          inProgress: shuffled.slice(backlogCount, backlogCount + inProgressCount),
          review: shuffled.slice(backlogCount + inProgressCount, backlogCount + inProgressCount + reviewCount),
          done: shuffled.slice(backlogCount + inProgressCount + reviewCount)
        };
        
        // Pre-assign members to some proposals for demo purposes
        // Assign to all "done" proposals and some "in progress" ones
        groupedProposals.done.forEach((proposal, index) => {
          if (index < demoAssignees.length) {
            (proposal as any).assignee = demoAssignees[index];
          } else {
            (proposal as any).assignee = demoAssignees[index % demoAssignees.length];
          }
        });
        
        // Assign to half of the "in progress" proposals
        groupedProposals.inProgress.forEach((proposal, index) => {
          if (index % 2 === 0 && index < demoAssignees.length) {
            (proposal as any).assignee = demoAssignees[index];
          }
        });
        
        console.log('ProposalBoard: Grouped proposals:', groupedProposals);
        console.log('ProposalBoard: About to set state...');
        
        setProposals(groupedProposals);
        setMembers(validMembers);
        
        console.log('ProposalBoard: State set successfully, attempting to save metadata...');
        
        // Save metadata
        try {
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
          console.log('ProposalBoard: Metadata saved successfully');
        } catch (metadataError) {
          console.error('ProposalBoard: Failed to save metadata:', metadataError);
          // Don't let metadata errors break the UI
        }
        
      } catch (error) {
        console.error('ProposalBoard: Failed to load data:', error);
        setError(`Failed to load proposals and members: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        console.log('ProposalBoard: Setting loading to false');
        setLoading(false);
      }
    };

    loadData().catch(err => {
      console.error('ProposalBoard: Uncaught error in loadData:', err);
      setError(`Uncaught error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    });
  }, [daoId]);

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    console.log('ProposalBoard: Task update:', taskId, updates);
    
    if (updates.assignee !== undefined) {
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
        action: 'task_update',
        taskId,
        timestamp: new Date().toISOString(),
        taskDetails: { taskId, updates }
      });

      await saveToFilecoin(metadata);
    } catch (error) {
      console.error('ProposalBoard: Failed to save proposal update metadata:', error);
    }
  };

  console.log('ProposalBoard: About to render, current state - loading:', loading, 'error:', error, 'proposals length:', Object.values(proposals).flat().length);

  if (loading) {
    console.log('ProposalBoard: Rendering loading state');
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
    console.log('ProposalBoard: Rendering error state:', error);
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  console.log('ProposalBoard: Rendering main board with proposals:', proposals);

  try {
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
              id: p.id || `backlog-${Math.random()}`,
              title: p.title || 'Untitled Proposal',
              description: p.description || 'No description available',
              assignee: (p as any).assignee || null,
              priority: 'medium' as const,
              deadline: p.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              type: p.category || 'operations',
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
              id: p.id || `progress-${Math.random()}`,
              title: p.title || 'Untitled Proposal',
              description: p.description || 'No description available',
              assignee: (p as any).assignee || null,
              priority: 'high' as const,
              deadline: p.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              type: p.category || 'operations',
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
              id: p.id || `review-${Math.random()}`,
              title: p.title || 'Untitled Proposal',
              description: p.description || 'No description available',
              assignee: (p as any).assignee || null,
              priority: 'medium' as const,
              deadline: p.deadline || p.created || new Date().toISOString(),
              type: p.category || 'operations',
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
              id: p.id || `done-${Math.random()}`,
              title: p.title || 'Untitled Proposal',
              description: p.description || 'No description available',
              assignee: (p as any).assignee || null,
              priority: 'low' as const,
              deadline: p.deadline || p.created || new Date().toISOString(),
              type: p.category || 'operations',
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
  } catch (renderError) {
    console.error('ProposalBoard: Render error:', renderError);
    return (
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Proposal Execution Board</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">Render Error: {renderError instanceof Error ? renderError.message : 'Unknown render error'}</div>
        </div>
      </div>
    );
  }
};
