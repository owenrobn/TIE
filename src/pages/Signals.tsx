"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Signals = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const signals = [
    {
      id: 'sig-001',
      chain: 'Ethereum Sepolia',
      type: 'New Contract Deployment',
      contract: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      score: 92,
      urgency: 'High',
      timestamp: '2023-06-15T14:30:00Z',
      status: 'New',
      detector: 'NewContractDeploymentDetector'
    },
    {
      id: 'sig-002',
      chain: 'Arbitrum Nitro',
      type: 'Staking Reward Spike',
      contract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      score: 85,
      urgency: 'Medium',
      timestamp: '2023-06-15T13:45:00Z',
      status: 'Reviewed',
      detector: 'StakingRewardSpikeDetector'
    },
    {
      id: 'sig-003',
      chain: 'Base Goerli',
      type: 'Liquidity Event',
      contract: '0x4200000000000000000000000000000000000006',
      score: 78,
      urgency: 'Low',
      timestamp: '2023-06-15T12:15:00Z',
      status: 'New',
      detector: 'LiquidityBootstrappingDetector'
    },
    {
      id: 'sig-004',
      chain: 'Optimism Goerli',
      type: 'Governance Activity',
      contract: '0x4200000000000000000000000000000000000042',
      score: 67,
      urgency: 'Low',
      timestamp: '2023-06-15T11:30:00Z',
      status: 'Reviewed',
      detector: 'GovernanceActivityDetector'
    }
  ];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSignals = React.useMemo(() => {
    if (!sortConfig) return signals;
    
    return [...signals].sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [signals, sortConfig]);

  const filteredSignals = sortedSignals.filter(signal => 
    signal.chain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.contract.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportSignals = () => {
    toast({
      title: "Export Started",
      description: "Signals export is being prepared. You'll receive a download link shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Signals</h1>
            <p className="text-gray-600">Monitor and analyze detected opportunities</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search signals..."
                className="pl-8 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button onClick={exportSignals}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detected Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer"
                      onClick={() => handleSort('chain')}
                    >
                      <div className="flex items-center">
                        Chain
                        {sortConfig?.key === 'chain' && (
                          sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortConfig?.key === 'type' && (
                          sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Contract</th>
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center">
                        Score
                        {sortConfig?.key === 'score' && (
                          sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer"
                      onClick={() => handleSort('urgency')}
                    >
                      <div className="flex items-center">
                        Urgency
                        {sortConfig?.key === 'urgency' && (
                          sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-medium cursor-pointer"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center">
                        Timestamp
                        {sortConfig?.key === 'timestamp' && (
                          sortConfig.direction === 'asc' ? 
                          <ChevronUp className="ml-1 h-4 w-4" /> : 
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{signal.chain}</div>
                        <div className="text-sm text-gray-500">{signal.detector}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{signal.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm">{signal.contract.substring(0, 6)}...{signal.contract.substring(signal.contract.length - 4)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={signal.score > 80 ? "default" : signal.score > 60 ? "secondary" : "outline"}
                        >
                          {signal.score}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={signal.urgency === 'High' ? "destructive" : signal.urgency === 'Medium' ? "default" : "secondary"}
                        >
                          {signal.urgency}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(signal.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signals;