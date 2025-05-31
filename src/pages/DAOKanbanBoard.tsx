
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProposalBoard } from '@/components/ProposalBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DAOKanbanBoard = () => {
  const { daoId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to={`/dao/${daoId}`}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categorization
            </Button>
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-white capitalize">{daoId} DAO</h1>
          </div>
          <p className="text-gray-300">Proposal execution board with DAOIP-4 categorization</p>
        </div>
        
        <ProposalBoard />
      </main>
    </div>
  );
};

export default DAOKanbanBoard;
