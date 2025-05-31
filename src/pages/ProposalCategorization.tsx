
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';

const categories = [
  { value: 'governance', label: 'Governance', color: 'bg-purple-500/20 text-purple-300' },
  { value: 'treasury', label: 'Treasury', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'technical', label: 'Technical', color: 'bg-cyan-500/20 text-cyan-300' },
  { value: 'community', label: 'Community', color: 'bg-pink-500/20 text-pink-300' },
  { value: 'grants', label: 'Grants', color: 'bg-green-500/20 text-green-300' },
  { value: 'operations', label: 'Operations', color: 'bg-orange-500/20 text-orange-300' }
];

const statusColors = {
  onchain: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  closed: 'bg-red-500/20 text-red-300 border-red-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30'
};

const ProposalCategorization = () => {
  const { daoId } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorizedProposals, setCategorizedProposals] = useState<Record<string, string>>({});
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    const loadProposals = async () => {
      if (!daoId) return;
      
      setLoading(true);
      try {
        const fetchedProposals = await fetchDAOProposals(daoId);
        setProposals(fetchedProposals);
        
        // Initialize with automatic categorization
        const initialCategories: Record<string, string> = {};
        fetchedProposals.forEach(proposal => {
          initialCategories[proposal.id] = proposal.category;
        });
        setCategorizedProposals(initialCategories);
        
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [daoId]);

  const handleCategoryChange = async (proposalId: string, newCategory: string) => {
    setCategorizedProposals(prev => ({
      ...prev,
      [proposalId]: newCategory
    }));

    // Generate metadata for categorization change
    const metadata = generateTaskMetadata({
      action: 'proposal_categorization',
      taskId: proposalId,
      timestamp: new Date().toISOString(),
      taskDetails: {
        proposalId,
        newCategory,
        daoId
      }
    });

    try {
      await saveToFilecoin(metadata);
    } catch (error) {
      console.error('Failed to save categorization metadata:', error);
    }
  };

  const handleProceedToKanban = async () => {
    setProcessingComplete(true);

    // Generate metadata for categorization completion
    const metadata = generateTaskMetadata({
      action: 'categorization_complete',
      taskId: `${daoId}-categorization-complete`,
      timestamp: new Date().toISOString(),
      taskDetails: {
        daoId,
        totalProposals: proposals.length,
        categorizedProposals: categorizedProposals
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
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white capitalize">{daoId} DAO</h1>
              <p className="text-gray-300">Review and categorize proposals before execution board</p>
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
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={statusColors[proposal.status as keyof typeof statusColors]}>
                    {proposal.status}
                  </Badge>
                  <Badge className={categories.find(c => c.value === categorizedProposals[proposal.id])?.color || 'bg-gray-500/20 text-gray-300'}>
                    {categories.find(c => c.value === categorizedProposals[proposal.id])?.label || 'Uncategorized'}
                  </Badge>
                </div>
                <CardTitle className="text-white text-lg leading-tight">
                  {proposal.title}
                </CardTitle>
                <p className="text-gray-300 text-sm">{proposal.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-xs text-gray-400">
                  <div>Author: {proposal.author}</div>
                  <div>Created: {new Date(proposal.created).toLocaleDateString()}</div>
                  {proposal.deadline && (
                    <div>Deadline: {new Date(proposal.deadline).toLocaleDateString()}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category (DAOIP-4)
                  </label>
                  <Select
                    value={categorizedProposals[proposal.id] || ''}
                    onValueChange={(value) => handleCategoryChange(proposal.id, value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value} className="text-white hover:bg-white/10">
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {proposals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No proposals found for this DAO.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProposalCategorization;
