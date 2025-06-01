
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, User, Calendar, Shield, Users, TrendingUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';
import { fetchDAOMembers, type Member } from '@/lib/memberService';
import { NotificationCenter } from '@/components/NotificationCenter';
import { notificationService } from '@/lib/notificationService';
import { blockscoutService } from '@/lib/blockscoutService';
import { Toaster } from '@/components/ui/sonner';

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-500/20 text-gray-300', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/20 text-blue-300', icon: AlertCircle },
  review: { label: 'Review', color: 'bg-yellow-500/20 text-yellow-300', icon: AlertCircle },
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

interface TaskProposal extends Proposal {
  taskStatus: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  daoSource: 'ens' | '1inch';
}

interface UserProfile {
  ensRole?: Member;
  inchRole?: Member;
  activeDAOs: string[];
}

const MemberProfile = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<TaskProposal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  useEffect(() => {
    // Initialize Blockscout Service when component mounts
    if (address) {
      blockscoutService.initialize({
        network: 'optimism',
        baseUrl: 'https://optimism.blockscout.com',
        rpcUrl: 'https://optimism.drpc.org',
        apiKey: process.env.REACT_PUBLIC_BLOCKSCOUT_API_KEY
      });

      const setupWatcher = async () => {
        const stopWatching = await blockscoutService.watchAddress(address, (transaction) => {
          console.log('New transaction detected:', transaction);
          notificationService.notifyBlockscoutEvent(
            'Transaction detected',
            `${transaction.value} ETH transferred`
          );
        });
        return stopWatching;
      };

      let cleanupFunction: (() => void) | undefined;

      setupWatcher().then((cleanup) => {
        cleanupFunction = cleanup;
      });

      return () => {
        if (cleanupFunction) {
          cleanupFunction();
        }
      };
    }
  }, [address]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!address) return;
      
      setLoading(true);
      try {
        // Fetch proposals and member data from both DAOs
        const [ensProposals, inchProposals, ensMembers, inchMembers] = await Promise.all([
          fetchDAOProposals('ens'),
          fetchDAOProposals('1inch'),
          fetchDAOMembers('ens'),
          fetchDAOMembers('1inch')
        ]);

        // Find user roles in both DAOs
        const ensRole = ensMembers.find(m => m.address?.toLowerCase() === address.toLowerCase());
        const inchRole = inchMembers.find(m => m.address?.toLowerCase() === address.toLowerCase());

        // Create user profile
        const profile: UserProfile = {
          ensRole,
          inchRole,
          activeDAOs: ['ENS DAO', '1INCH DAO'] // Always show both DAOs
        };

        setUserProfile(profile);

        // Transform proposals to task format - simulate assignments
        const allProposals = [
          ...ensProposals.map(p => ({ ...p, daoSource: 'ens' as const })),
          ...inchProposals.map(p => ({ ...p, daoSource: '1inch' as const }))
        ];

        const taskProposals: TaskProposal[] = allProposals
          .slice(0, 12) // Limit to first 12 proposals
          .map((proposal, index) => ({
            ...proposal,
            taskStatus: (index % 4 === 0 ? 'todo' : 
                        index % 4 === 1 ? 'in-progress' :
                        index % 4 === 2 ? 'review' : 'done') as 'todo' | 'in-progress' | 'review' | 'done',
            assignee: index % 3 === 0 ? address : undefined, // Assign every 3rd task to user
            priority: (index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
          }))
          .filter(proposal => proposal.assignee === address);

        setProposals(taskProposals);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [address]);

  const handleStatusChange = (proposalId: string, newStatus: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      const oldStatus = proposal.taskStatus;
      
      setProposals(prev => 
        prev.map(p => p.id === proposalId ? { ...p, taskStatus: newStatus as any } : p)
      );
      
      notificationService.notifyStatusChange(
        proposal.title,
        statusConfig[oldStatus].label,
        statusConfig[newStatus as keyof typeof statusConfig].label
      );
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
            <div className="text-white">Loading your profile...</div>
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
            className="bg-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to DAO List
          </Button>
          
          {/* User Profile Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-lg bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Member Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-300 text-sm">Wallet Address:</p>
                    <p className="text-white font-mono text-sm break-all">
                      {address}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300 text-sm mb-2">Active DAOs:</p>
                      <div className="flex flex-wrap gap-2">
                        {userProfile?.activeDAOs.map(dao => (
                          <Badge key={dao} className="bg-blue-500/20 text-blue-300">
                            {dao}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-300 text-sm mb-2">Roles:</p>
                      <div className="space-y-2">
                        {userProfile?.ensRole && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                              ENS: {userProfile.ensRole.role || 'Member'}
                            </Badge>
                            {userProfile.ensRole.domain && userProfile.ensRole.domain !== 'unassigned' && (
                              <Badge className="bg-indigo-500/20 text-indigo-300 text-xs">
                                {userProfile.ensRole.domain}
                              </Badge>
                            )}
                          </div>
                        )}
                        {userProfile?.inchRole && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                              1INCH: {userProfile.inchRole.role || 'Member'}
                            </Badge>
                            {userProfile.inchRole.domain && userProfile.inchRole.domain !== 'unassigned' && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                                {userProfile.inchRole.domain}
                              </Badge>
                            )}
                          </div>
                        )}
                        {!userProfile?.ensRole && !userProfile?.inchRole && (
                          <span className="text-gray-400 text-sm">No active roles</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* DAO Roles */}
            <div className="space-y-4">
              {userProfile?.ensRole && (
                <Card className="backdrop-blur-lg bg-white/10 border-white/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      ENS DAO Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-gray-300 text-xs">Name:</p>
                      <p className="text-white text-sm truncate" title={userProfile.ensRole.name}>
                        {userProfile.ensRole.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs">Role:</p>
                      <p className="text-white text-sm">
                        {userProfile.ensRole.role || 'Member'}
                      </p>
                    </div>
                    {userProfile.ensRole.domain && userProfile.ensRole.domain !== 'unassigned' && (
                      <div>
                        <p className="text-gray-300 text-xs">Domain:</p>
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          {userProfile.ensRole.domain}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {userProfile?.inchRole && (
                <Card className="backdrop-blur-lg bg-white/10 border-white/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      1INCH DAO Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-gray-300 text-xs">Name:</p>
                      <p className="text-white text-sm truncate" title={userProfile.inchRole.name}>
                        {userProfile.inchRole.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs">Role:</p>
                      <p className="text-white text-sm">
                        {userProfile.inchRole.role || 'Member'}
                      </p>
                    </div>
                    {userProfile.inchRole.domain && userProfile.inchRole.domain !== 'unassigned' && (
                      <div>
                        <p className="text-gray-300 text-xs">Domain:</p>
                        <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                          {userProfile.inchRole.domain}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">My Assigned Tasks</h1>
                <NotificationCenter />
              </div>
            </div>
          </div>
        </div>

        {/* Task Status Board */}
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
                          <Badge variant="outline" className="border-blue-400/50 text-blue-300 text-xs shrink-0">
                            {proposal.daoSource.toUpperCase()}
                          </Badge>
                        </div>
                        <CardTitle className="text-white text-sm leading-tight line-clamp-2" title={proposal.title}>
                          {proposal.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-gray-300 text-xs line-clamp-3" title={proposal.description}>
                          {proposal.description}
                        </p>
                        
                        <div className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">
                            Created: {new Date(proposal.created).toLocaleDateString()}
                          </span>
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
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full"
                            >
                              {status === 'todo' ? 'Start Working' : 
                               status === 'in-progress' ? 'Submit for Review' : 'Mark Complete'}
                            </Button>
                          )}
                          {status === 'done' && (
                            <div className="flex items-center justify-center w-full py-2">
                              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                              <span className="text-green-400 text-xs">Completed</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusProposals.length === 0 && (
                    <Card className="backdrop-blur-lg bg-white/5 border-white/10 border-dashed">
                      <CardContent className="flex items-center justify-center py-8">
                        <p className="text-gray-400 text-sm">No tasks</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {proposals.length === 0 && !loading && (
          <Card className="backdrop-blur-lg bg-white/10 border-white/20 mt-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No Assigned Tasks</h3>
              <p className="text-gray-400 text-center max-w-md">
                You don't have any tasks assigned to you yet from ENS or 1INCH DAOs. 
                Check back later or visit the DAO boards to see available tasks.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Toaster />
    </div>
  );
};

export default MemberProfile;
