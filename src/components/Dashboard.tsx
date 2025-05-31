
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Users, Zap } from 'lucide-react';

export const Dashboard = () => {
  const stats = [
    {
      title: "Active Proposals",
      value: "12",
      icon: Clock,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Completed Tasks",
      value: "47",
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Active Contributors",
      value: "23",
      icon: Users,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Random Assignments",
      value: "8",
      icon: Zap,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-6">DAO Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="backdrop-blur-lg bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
