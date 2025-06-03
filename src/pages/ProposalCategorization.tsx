
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { fetchDAOProposals, type Proposal } from '@/lib/proposalService';
import { generateTaskMetadata, saveToFilecoin } from '@/lib/metadata';
import { toast } from '@/components/ui/use-toast';
import { Tags, Save, Eye, Download } from 'lucide-react';

// DAOIP-4 proposal types
const DAOIP4_TYPES = {
  'treasury/grant': { label: 'Treasury - Grant', category: 'Treasury' },
  'treasury/budget': { label: 'Treasury - Budget', category: 'Treasury' },
  'treasury/investment': { label: 'Treasury - Investment', category: 'Treasury' },
  'treasury/other': { label: 'Treasury - Other', category: 'Treasury' },
  'protocol/small-change': { label: 'Protocol - Small Change', category: 'Protocol' },
  'protocol/major-change': { label: 'Protocol - Major Change', category: 'Protocol' },
  'protocol/other': { label: 'Protocol - Other', category: 'Protocol' },
  'metagov/small-change': { label: 'Metagovernance - Small Change', category: 'Metagovernance' },
  'metagov/major-change': { label: 'Metagovernance - Major Change', category: 'Metagovernance' },
  'metagov/delegate-governance': { label: 'Metagovernance - Delegate Governance', category: 'Metagovernance' },
  'metagov/spinout': { label: 'Metagovernance - Spinout', category: 'Metagovernance' },
  'metagov/merger': { label: 'Metagovernance - Merger', category: 'Metagovernance' },
  'metagov/other': { label: 'Metagovernance - Other', category: 'Metagovernance' }
} as const;

type DAOIP4Type = keyof typeof DAOIP4_TYPES;

interface CategorizedProposal extends Proposal {
  daoip4Type?: DAOIP4Type;
  categorizedAt?: string;
  categorizedBy?: string;
}

export default function ProposalCategorization() {
  const { daoId } = useParams();
  const [proposals, setProposals] = useState<CategorizedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<CategorizedProposal | null>(null);
  const [categorizing, setCategorizing] = useState<string | null>(null);

  useEffect(() => {
    const loadProposals = async () => {
      if (!daoId) return;
      
      try {
        setLoading(true);
        const fetchedProposals = await fetchDAOProposals(daoId);
        
        // Load existing categorizations from localStorage
        const savedCategorizations = JSON.parse(
          localStorage.getItem(`dao-categorizations-${daoId}`) || '{}'
        );
        
        const categorizedProposals = fetchedProposals.map(proposal => ({
          ...proposal,
          daoip4Type: savedCategorizations[proposal.id]?.daoip4Type,
          categorizedAt: savedCategorizations[proposal.id]?.categorizedAt,
          categorizedBy: savedCategorizations[proposal.id]?.categorizedBy
        }));
        
        setProposals(categorizedProposals);
      } catch (error) {
        console.error('Failed to load proposals:', error);
        toast({
          title: 'Error',
          description: 'Failed to load proposals',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [daoId]);

  const handleCategorize = async (proposalId: string, daoip4Type: DAOIP4Type) => {
    try {
      setCategorizing(proposalId);
      
      // Update the proposal
      const updatedProposals = proposals.map(p => 
        p.id === proposalId 
          ? { 
              ...p, 
              daoip4Type, 
              categorizedAt: new Date().toISOString(),
              categorizedBy: 'user' // Could be replaced with actual user address
            }
          : p
      );
      
      setProposals(updatedProposals);
      
      // Save to localStorage
      const savedCategorizations = JSON.parse(
        localStorage.getItem(`dao-categorizations-${daoId}`) || '{}'
      );
      
      savedCategorizations[proposalId] = {
        daoip4Type,
        categorizedAt: new Date().toISOString(),
        categorizedBy: 'user'
      };
      
      localStorage.setItem(`dao-categorizations-${daoId}`, JSON.stringify(savedCategorizations));
      
      // Generate and save metadata
      const metadata = generateTaskMetadata({
        action: 'proposal_categorization',
        taskId: proposalId,
        timestamp: new Date().toISOString(),
        taskDetails: {
          daoId,
          proposalId,
          daoip4Type,
          proposalTitle: proposals.find(p => p.id === proposalId)?.title
        }
      });
      
      await saveToFilecoin(metadata);
      
      toast({
        title: 'Success',
        description: `Proposal categorized as ${DAOIP4_TYPES[daoip4Type].label}`
      });
      
    } catch (error) {
      console.error('Failed to categorize proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to save categorization',
        variant: 'destructive'
      });
    } finally {
      setCategorizing(null);
    }
  };

  const exportCategorizations = () => {
    const categorizedProposals = proposals.filter(p => p.daoip4Type);
    const jsonLD = {
      "@context": "https://daostar.org/contexts/proposal.jsonld",
      "@type": "ProposalCollection",
      "dao": daoId,
      "proposals": categorizedProposals.map(proposal => ({
        "@type": "Proposal",
        "id": proposal.id,
        "title": proposal.title,
        "description": proposal.description,
        "proposalType": proposal.daoip4Type,
        "author": proposal.author,
        "created": proposal.created,
        "status": proposal.status,
        "url": proposal.url,
        "categorizedAt": proposal.categorizedAt,
        "categorizedBy": proposal.categorizedBy
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonLD, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${daoId}-categorized-proposals.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Treasury': return 'bg-green-500';
      case 'Protocol': return 'bg-blue-500';
      case 'Metagovernance': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const categorizedCount = proposals.filter(p => p.daoip4Type).length;
  const uncategorizedCount = proposals.length - categorizedCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading proposals...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Proposal Categorization - {daoId?.toUpperCase()}
            </h1>
            <p className="text-gray-300">
              Categorize proposals according to DAOIP-4 standard
            </p>
          </div>
          <Button onClick={exportCategorizations} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export JSON-LD
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Total Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{proposals.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Categorized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{categorizedCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Uncategorized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-400">{uncategorizedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Proposals Table */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Tags className="w-5 h-5 mr-2" />
              Proposals
            </CardTitle>
            <CardDescription className="text-gray-300">
              Click on a proposal to view details and categorize according to DAOIP-4
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Title</TableHead>
                  <TableHead className="text-gray-300">Author</TableHead>
                  <TableHead className="text-gray-300">Current Category</TableHead>
                  <TableHead className="text-gray-300">DAOIP-4 Type</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="text-white font-medium">
                      {proposal.title}
                    </TableCell>
                    <TableCell className="text-gray-300">{proposal.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-white border-white/30">
                        {proposal.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proposal.daoip4Type ? (
                        <Badge className={`${getCategoryColor(DAOIP4_TYPES[proposal.daoip4Type].category)} text-white`}>
                          {DAOIP4_TYPES[proposal.daoip4Type].label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-400 border-orange-400">
                          Uncategorized
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProposal(proposal)}
                            className="text-white border-white/30 hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Categorize
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Categorize Proposal</DialogTitle>
                            <DialogDescription className="text-gray-300">
                              Assign a DAOIP-4 proposal type to this proposal
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedProposal && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                  {selectedProposal.title}
                                </h3>
                                <p className="text-gray-300 text-sm mb-4">
                                  {selectedProposal.description}
                                </p>
                                <div className="flex gap-2 mb-4">
                                  <Badge variant="outline" className="text-white border-white/30">
                                    Current: {selectedProposal.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-white border-white/30">
                                    Author: {selectedProposal.author}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-white font-medium mb-2 block">
                                  Select DAOIP-4 Type:
                                </label>
                                <Select 
                                  onValueChange={(value) => handleCategorize(selectedProposal.id, value as DAOIP4Type)}
                                  disabled={categorizing === selectedProposal.id}
                                >
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Choose a proposal type..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-600">
                                    {Object.entries(DAOIP4_TYPES).map(([key, value]) => (
                                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                                        <div>
                                          <div className="font-medium">{value.label}</div>
                                          <div className="text-sm text-gray-400">{value.category}</div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
