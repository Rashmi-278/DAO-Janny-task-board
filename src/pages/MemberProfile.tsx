import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bell, CheckCircle, Clock, AlertCircle, User, Calendar } from 'lucide-react';
import { Header } from '@/components/Header';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';
import { NotificationCenter } from '@/components/NotificationCenter';
import { notificationService } from '@/lib/notificationService';
import { blockscoutService } from '@/lib/blockscoutService';
import { Toaster } from '@/components/ui/sonner';

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-500/20 text-gray-300', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300', icon: AlertCircle },
  review: { label: 'Review', color: 'bg-yellow-500/20 text-yellow-300', icon: Bell },
  done: { label: 'Done', color: 'bg-green-500/20 text-green-300', icon: CheckCircle }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-green-500/20 text-green-300' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-300' },
  high: { label: 'High', color: 'bg-red-500/20 text-red-300' }
};

const categoryColors = {
  governance: 'bg-purple-500/20 text-purple-300',
  treasury: 'bg-blue-500/20 text-blue-300',
  technical: 'bg-cyan-500/20 text-cyan-300',
  community: 'bg-pink-500/20 text-pink-300',
  grants: 'bg-orange-500/20 text-orange-300',
  operations: 'bg-gray-500/20 text-gray-300'
};

// Mock members for assignment
const mockMembers = [
  { id: '1', name: 'Alice Cooper', address: '0x1234...5678' },
  { id: '2', name: 'Bob Wilson', address: '0x2345...6789' },
  { id: '3', name: 'Charlie Brown', address: '0x3456...7890' },
  { id: '4', name: 'Diana Prince', address: '0x4567...8901' }
];

interface TaskProposal extends Proposal {
  taskStatus: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

const MemberProfile = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<TaskProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    // Initialize Blockscout SDK when component mounts
    if (address) {
      blockscoutService.initialize({
        network: 'optimism-sepolia',
        baseUrl: 'https://optimism-sepolia.blockscout.com'
      });

      // Start monitoring the user's address
      blockscoutService.watchAddress(address);
    }
  }, [address]);

  useEffect(() => {
    const loadProposals = async () => {
      setLoading(true);
      try {
        // Fetch proposals from both DAOs
        const [ensProposals, inchProposals] = await Promise.all([
          fetchDAOProposals('ens'),
          fetchDAOProposals('1inch')
        ]);

        // Transform proposals to task format
        const allProposals = [...ensProposals, ...inchProposals];
        const taskProposals: TaskProposal[] = allProposals.map((proposal, index) => ({
          ...proposal,
          taskStatus: index % 4 === 0 ? 'todo' : 
                     index % 4 === 1 ? 'in-progress' :
                     index % 4 === 2 ? 'review' : 'done',
          assignee: index % 3 === 0 ? mockMembers[index % mockMembers.length].name : undefined,
          priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low'
        }));

        setProposals(taskProposals);
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, []);

  const handleStatusChange = (proposalId: string, newStatus: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      const oldStatus = proposal.taskStatus;
      
      setProposals(prev => 
        prev.map(p => p.id === proposalId ? { ...p, taskStatus: newStatus as any } : p)
      );
      
      // Send notification
      notificationService.notifyStatusChange(
        proposal.title,
        statusConfig[oldStatus].label,
        statusConfig[newStatus as keyof typeof statusConfig].label
      );
      
      console.log(`Status changed for ${proposalId} to ${newStatus}`);
    }
  };

  const handleAssignMember = (proposalId: string, memberName: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      setProposals(prev => 
        prev.map(p => p.id === proposalId ? { ...p, assignee: memberName } : p)
      );
      
      // Send notification
      notificationService.notifyTaskAssignment(proposal.title, memberName);
      
      console.log(`Assigned ${memberName} to proposal ${proposalId}`);
    }
  };

  const groupedProposals = {
    todo: proposals.filter(p => p.taskStatus === 'todo'),
    'in-progress': proposals.filter(p => p.taskStatus === 'in-progress'),
    review: proposals.filter(p => p.taskStatus === 'review'),
    done: proposals.filter(p => p.taskStatus === 'done')
  };

  if (!isConnected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading proposals...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to DAO List
          </Button>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Member Profile</h1>
              <p className="text-gray-300">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p className="text-gray-400 text-sm mt-1">
                Total proposals: {proposals.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Mini Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(groupedProposals).map(([status, statusProposals]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config.icon;
            
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-semibold text-white">{config.label}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-white/20 text-white">
                    {statusProposals.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {statusProposals.map((proposal) => (
                    <Card key={proposal.id} className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge className={priorityConfig[proposal.priority].color}>
                              {priorityConfig[proposal.priority].label}
                            </Badge>
                            <Badge className={categoryColors[proposal.category as keyof typeof categoryColors] || 'bg-gray-500/20 text-gray-300'}>
                              {proposal.category}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="border-blue-400/50 text-blue-300 text-xs">
                            {proposal.id.includes('ens') ? 'ENS' : '1INCH'}
                          </Badge>
                        </div>
                        <CardTitle className="text-white text-sm leading-tight">
                          {proposal.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-gray-300 text-xs">
                          {proposal.description}
                        </p>
                        
                        <div className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Created: {new Date(proposal.created).toLocaleDateString()}
                        </div>
                        
                        {/* Member Assignment */}
                        <div className="space-y-2">
                          {proposal.assignee ? (
                            <div className="flex items-center text-xs text-gray-400">
                              <User className="w-3 h-3 mr-2" />
                              Assigned to: {proposal.assignee}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs text-gray-300 mb-1">Assign Member</label>
                              <Select onValueChange={(value) => handleAssignMember(proposal.id, value)}>
                                <SelectTrigger className="h-7 text-xs bg-white/10 border-white/20 text-white">
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-white/20 z-50">
                                  {mockMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.name} className="text-white hover:bg-white/10">
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        {/* Status Change Button */}
                        <div className="flex gap-2">
                          {status !== 'done' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const nextStatus = status === 'todo' ? 'in-progress' : 
                                                 status === 'in-progress' ? 'review' : 'done';
                                handleStatusChange(proposal.id, nextStatus);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              {status === 'todo' ? 'Start' : 
                               status === 'in-progress' ? 'Review' : 'Complete'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusProposals.length === 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10 border-dashed">
                      <CardContent className="flex items-center justify-center py-8">
                        <p className="text-gray-400 text-sm">No proposals</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default MemberProfile;
