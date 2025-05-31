
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Vote, TrendingUp, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockDAOs = [
  {
    id: 'uniswap',
    name: 'Uniswap DAO',
    description: 'Decentralized exchange protocol governance',
    members: 45000,
    activeProposals: 12,
    treasuryValue: '$2.1B',
    category: 'Protocol DAO',
    logo: '🦄'
  },
  {
    id: 'aave',
    name: 'Aave DAO',
    description: 'Decentralized lending protocol governance',
    members: 32000,
    activeProposals: 8,
    treasuryValue: '$890M',
    category: 'Protocol DAO',
    logo: '👻'
  },
  {
    id: 'gitcoin',
    name: 'Gitcoin DAO',
    description: 'Public goods funding and developer ecosystem',
    members: 15000,
    activeProposals: 15,
    treasuryValue: '$45M',
    category: 'Grant DAO',
    logo: '🌱'
  },
  {
    id: 'nouns',
    name: 'Nouns DAO',
    description: 'NFT collective focused on funding public goods',
    members: 8500,
    activeProposals: 23,
    treasuryValue: '$67M',
    category: 'Collector DAO',
    logo: '⌐◨-◨'
  }
];

const categoryColors = {
  'Protocol DAO': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Grant DAO': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Collector DAO': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Service DAO': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
};

const DAOList = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">ShoreGun</h1>
            <p className="text-xl text-gray-300 mb-4">DAO Proposal Execution Boards</p>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Turn DAO proposals into actionable tasks with delegate assignment and execution tracking
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Select a DAO</h2>
          <p className="text-gray-300">Choose a DAO to view their proposal execution board</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDAOs.map((dao) => (
            <Card key={dao.id} className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{dao.logo}</div>
                  <Badge className={categoryColors[dao.category as keyof typeof categoryColors]}>
                    {dao.category}
                  </Badge>
                </div>
                <CardTitle className="text-white text-xl">{dao.name}</CardTitle>
                <p className="text-gray-300 text-sm">{dao.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    {dao.members.toLocaleString()} members
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Vote className="w-4 h-4 mr-2" />
                    {dao.activeProposals} active
                  </div>
                  <div className="flex items-center text-gray-400 col-span-2">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Treasury: {dao.treasuryValue}
                  </div>
                </div>

                <Link to={`/dao/${dao.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    View Execution Board
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="backdrop-blur-lg bg-white/5 border-white/10 border-dashed max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="text-4xl">➕</div>
              <h3 className="text-white font-semibold">Add Your DAO</h3>
              <p className="text-gray-400 text-sm text-center">
                Connect your DAO to start tracking proposal execution
              </p>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Request Integration
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DAOList;
