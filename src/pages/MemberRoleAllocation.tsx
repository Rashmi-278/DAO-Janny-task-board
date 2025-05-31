
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { fetchDAOMembers, type Member } from '@/lib/memberService';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';

const roles = [
  { value: 'reviewer', label: 'Reviewer', color: 'bg-purple-500/20 text-purple-300' },
  { value: 'executor', label: 'Executor', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'analyst', label: 'Analyst', color: 'bg-cyan-500/20 text-cyan-300' },
  { value: 'coordinator', label: 'Coordinator', color: 'bg-pink-500/20 text-pink-300' },
  { value: 'unassigned', label: 'Unassigned', color: 'bg-gray-500/20 text-gray-300' }
];

const MemberRoleAllocation = () => {
  const { daoId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      if (!daoId) return;
      
      setLoading(true);
      try {
        const fetchedMembers = await fetchDAOMembers(daoId);
        setMembers(fetchedMembers);
        
        // Initialize with default roles
        const initialRoles: Record<string, string> = {};
        fetchedMembers.forEach(member => {
          initialRoles[member.id] = member.role || 'unassigned';
        });
        setMemberRoles(initialRoles);
        
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [daoId]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setMemberRoles(prev => ({
      ...prev,
      [memberId]: newRole
    }));

    // Generate metadata for role assignment
    const metadata = generateTaskMetadata({
      action: 'delegate_opt_in',
      taskId: memberId,
      timestamp: new Date().toISOString(),
      delegateAddress: members.find(m => m.id === memberId)?.address,
      taskDetails: {
        memberId,
        newRole,
        daoId
      }
    });

    try {
      await saveToFilecoin(metadata);
    } catch (error) {
      console.error('Failed to save role assignment metadata:', error);
    }
  };

  const handleProceedToKanban = async () => {
    setProcessingComplete(true);

    // Generate metadata for role allocation completion
    const metadata = generateTaskMetadata({
      action: 'random_assignment',
      taskId: `${daoId}-role-allocation-complete`,
      timestamp: new Date().toISOString(),
      taskDetails: {
        daoId,
        totalMembers: members.length,
        roleAllocations: memberRoles
      }
    });

    try {
      await saveToFilecoin(metadata);
      
      // Navigate to the kanban board after a brief delay
      setTimeout(() => {
        navigate(`/dao/${daoId}/board`);
      }, 1000);
    } catch (error) {
      console.error('Failed to save completion metadata:', error);
      // Still navigate even if metadata save fails
      navigate(`/dao/${daoId}/board`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading members...</div>
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
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white capitalize">{daoId} DAO</h1>
              <p className="text-gray-300">Assign roles to DAO members before proposal execution board</p>
            </div>
            
            <Button 
              onClick={handleProceedToKanban}
              disabled={processingComplete}
              className="bg-gradient-to-r from-blue-800 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              {processingComplete ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Proceed to Kanban Board
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={roles.find(r => r.value === memberRoles[member.id])?.color || 'bg-gray-500/20 text-gray-300'}>
                    {roles.find(r => r.value === memberRoles[member.id])?.label || 'Unassigned'}
                  </Badge>
                  <div className="flex items-center text-gray-400 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {member.votingWeight || 0}
                  </div>
                </div>
                <CardTitle className="text-white text-lg leading-tight">
                  {member.name}
                </CardTitle>
                <p className="text-gray-300 text-sm font-mono">
                  {member.address.slice(0, 6)}...{member.address.slice(-4)}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Delegated Votes: {member.delegatedVotes?.toLocaleString() || 0}</div>
                  <div>Voting Weight: {member.votingWeight?.toLocaleString() || 0}</div>
                  <div>Proposals Created: {member.proposalsCreated || 0}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign Role
                  </label>
                  <Select
                    value={memberRoles[member.id] || 'unassigned'}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value} className="text-white hover:bg-white/10">
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No members found for this DAO.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberRoleAllocation;
