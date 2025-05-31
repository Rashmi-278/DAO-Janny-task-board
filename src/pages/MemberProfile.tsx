
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";

// Mock data for assigned proposals - in real app this would come from API
const mockAssignedProposals = [
  {
    id: "prop-1",
    title: "Upgrade Protocol V2",
    description: "Implement new features for protocol enhancement",
    status: "todo",
    priority: "high" as const,
    deadline: "2024-01-15",
    assigneeRole: "reviewer",
    domain: "tech",
    daoId: "ens"
  },
  {
    id: "prop-2", 
    title: "Treasury Allocation Review",
    description: "Review and approve quarterly treasury allocation",
    status: "in-progress",
    priority: "medium" as const,
    deadline: "2024-01-20",
    assigneeRole: "analyst",
    domain: "accounting",
    daoId: "ens"
  },
  {
    id: "prop-3",
    title: "Partnership Agreement",
    description: "Draft partnership terms with external protocol",
    status: "review",
    priority: "low" as const,
    deadline: "2024-01-25",
    assigneeRole: "coordinator",
    domain: "business_development",
    daoId: "1inch"
  }
];

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

const MemberProfile = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  const [proposals, setProposals] = useState(mockAssignedProposals);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    setProposals(prev => 
      prev.map(p => p.id === proposalId ? { ...p, status: newStatus } : p)
    );

    // Simulate a transaction for status update
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    try {
      await openTxToast("10", mockTxHash); // Using Optimism chain ID
    } catch (error) {
      console.error('Failed to show transaction toast:', error);
    }
  };

  const handleViewTransactionHistory = () => {
    if (address) {
      openPopup({
        chainId: "10", // Optimism
        address: address
      });
    }
  };

  const groupedProposals = {
    todo: proposals.filter(p => p.status === 'todo'),
    'in-progress': proposals.filter(p => p.status === 'in-progress'),
    review: proposals.filter(p => p.status === 'review'),
    done: proposals.filter(p => p.status === 'done')
  };

  if (!isConnected) {
    return null;
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
                Total assigned proposals: {proposals.length}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleViewTransactionHistory}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                <Bell className="w-4 h-4 mr-2" />
                Transaction History
              </Button>
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
                          <Badge className={priorityConfig[proposal.priority].color}>
                            {priorityConfig[proposal.priority].label}
                          </Badge>
                          <Badge variant="outline" className="border-blue-400/50 text-blue-300 text-xs">
                            {proposal.daoId.toUpperCase()}
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
                        
                        <div className="flex flex-wrap gap-1">
                          <Badge className="bg-green-500/20 text-green-300 text-xs">
                            {proposal.assigneeRole}
                          </Badge>
                          <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                            {proposal.domain}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          Deadline: {new Date(proposal.deadline).toLocaleDateString()}
                        </div>
                        
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
    </div>
  );
};

export default MemberProfile;
