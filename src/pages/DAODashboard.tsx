
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ProposalBoard } from '@/components/ProposalBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DAODashboard = () => {
  const { daoId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="border-white/5 text-purple hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to DAO List
            </Button>
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-white capitalize">{daoId} DAO</h1>
          </div>
          <p className="text-gray-300">Proposal execution board with DAOIP-4 categorization</p>
        </div>
        
        <Dashboard />
        <ProposalBoard />
      </main>
    </div>
  );
};

export default DAODashboard;
