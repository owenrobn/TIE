"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Testnet Intelligence Engine</h1>
            <p className="text-gray-600">Monitor and analyze testnet opportunities in real-time</p>
          </div>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Run Detectors
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+12 from last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detectors Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8/12</div>
              <p className="text-xs text-muted-foreground">4 offline</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">82.4</div>
              <p className="text-xs text-muted-foreground">+5.2 from yesterday</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, chain: 'Ethereum Sepolia', type: 'New Contract', score: 92, time: '2 min ago' },
                  { id: 2, chain: 'Arbitrum Nitro', type: 'Staking Reward', score: 78, time: '15 min ago' },
                  { id: 3, chain: 'Base Goerli', type: 'Liquidity Event', score: 85, time: '32 min ago' },
                  { id: 4, chain: 'Optimism Goerli', type: 'Governance', score: 67, time: '1 hour ago' },
                ].map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium">{signal.chain}</div>
                      <div className="text-sm text-gray-500">{signal.type}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={signal.score > 80 ? "default" : signal.score > 60 ? "secondary" : "outline"}>
                        {signal.score}
                      </Badge>
                      <span className="text-sm text-gray-500">{signal.time}</span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detector Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'NewChainDetector', status: 'active', chain: 'All' },
                  { name: 'NewContractDeploymentDetector', status: 'active', chain: 'EVM' },
                  { name: 'StakingRewardSpikeDetector', status: 'active', chain: 'All' },
                  { name: 'BridgeEventDetector', status: 'offline', chain: 'All' },
                  { name: 'GovernanceActivityDetector', status: 'active', chain: 'EVM' },
                  { name: 'LiquidityBootstrappingDetector', status: 'active', chain: 'EVM' },
                ].map((detector, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{detector.name}</div>
                      <div className="text-sm text-gray-500">{detector.chain}</div>
                    </div>
                    <Badge variant={detector.status === 'active' ? 'default' : 'destructive'}>
                      {detector.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;