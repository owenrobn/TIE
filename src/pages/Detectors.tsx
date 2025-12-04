"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Detectors = () => {
  const { toast } = useToast();
  const [detectors, setDetectors] = useState([
    {
      id: 'detector-1',
      name: 'NewChainDetector',
      description: 'Detects new testnets, devnets, and proto-mainnets early',
      chains: ['All'],
      status: 'active',
      lastRun: '2023-06-15T14:30:00Z',
      enabled: true
    },
    {
      id: 'detector-2',
      name: 'NewContractDeploymentDetector',
      description: 'Identifies smart contracts that signal high-value airdrop potential',
      chains: ['EVM', 'Solana'],
      status: 'active',
      lastRun: '2023-06-15T14:25:00Z',
      enabled: true
    },
    {
      id: 'detector-3',
      name: 'StakingRewardSpikeDetector',
      description: 'Analyzes reward mechanics such as staking, AMMs, bridges, governance',
      chains: ['All'],
      status: 'active',
      lastRun: '2023-06-15T14:20:00Z',
      enabled: true
    },
    {
      id: 'detector-4',
      name: 'BridgeEventDetector',
      description: 'Monitors bridge events for cross-chain opportunities',
      chains: ['EVM', 'Cosmos'],
      status: 'offline',
      lastRun: '2023-06-15T10:15:00Z',
      enabled: false
    },
    {
      id: 'detector-5',
      name: 'GovernanceActivityDetector',
      description: 'Detects governance proposals and voting opportunities',
      chains: ['EVM'],
      status: 'active',
      lastRun: '2023-06-15T14:10:00Z',
      enabled: true
    },
    {
      id: 'detector-6',
      name: 'LiquidityBootstrappingDetector',
      description: 'Identifies new liquidity pools and bootstrapping events',
      chains: ['EVM'],
      status: 'active',
      lastRun: '2023-06-15T14:05:00Z',
      enabled: true
    },
    {
      id: 'detector-7',
      name: 'PriceMismatchDetector',
      description: 'Detects MEV-style price inefficiencies on testnets',
      chains: ['EVM'],
      status: 'active',
      lastRun: '2023-06-15T13:55:00Z',
      enabled: true
    },
    {
      id: 'detector-8',
      name: 'OracleLagDetector',
      description: 'Monitors oracle delays for arbitrage opportunities',
      chains: ['EVM'],
      status: 'active',
      lastRun: '2023-06-15T13:50:00Z',
      enabled: true
    }
  ]);

  const toggleDetector = (id: string) => {
    setDetectors(detectors.map(detector => 
      detector.id === id 
        ? { ...detector, enabled: !detector.enabled } 
        : detector
    ));
    
    const detector = detectors.find(d => d.id === id);
    if (detector) {
      toast({
        title: `${detector.enabled ? 'Disabled' : 'Enabled'} Detector`,
        description: `${detector.name} has been ${detector.enabled ? 'disabled' : 'enabled'}.`
      });
    }
  };

  const restartDetector = (id: string) => {
    const detector = detectors.find(d => d.id === id);
    if (detector) {
      toast({
        title: "Restarting Detector",
        description: `${detector.name} is restarting...`
      });
    }
  };

  const activeCount = detectors.filter(d => d.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detectors</h1>
            <p className="text-gray-600">Manage and monitor detection modules</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">{activeCount} Active</span>
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {detectors.map((detector) => (
            <Card key={detector.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {detector.name}
                      <Badge 
                        variant={detector.status === 'active' ? 'default' : 'destructive'}
                        className="ml-2"
                      >
                        {detector.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{detector.description}</p>
                  </div>
                  <Switch
                    checked={detector.enabled}
                    onCheckedChange={() => toggleDetector(detector.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {detector.chains.map((chain, index) => (
                    <Badge key={index} variant="secondary">
                      {chain}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Last run: {new Date(detector.lastRun).toLocaleString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => restartDetector(detector.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!detector.enabled}
                    >
                      {detector.enabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Detectors;