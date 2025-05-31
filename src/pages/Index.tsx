
import React from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ProposalBoard } from '@/components/ProposalBoard';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Dashboard />
        <ProposalBoard />
      </main>
    </div>
  );
};

export default Index;
