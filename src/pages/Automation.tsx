"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  Bot,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; // Import Input for address field

interface Faucet {
  id: string;
  name: string;
  url: string;
  chainId: string;
  token: string;
  cooldown: number; // in milliseconds
}

const Automation = () => {
  const { toast } = useToast();
  const [automationRules, setAutomationRules] = useState([
    {
      id: 'auto-claim-rewards',
      name: 'Auto Claim Rewards',
      description: 'Automatically claim staking rewards when above threshold',
      enabled: true,
      conditions: {
        minScore: 80,
        type: 'Staking Reward Spike'
      },
      status: 'active'
    },
    {
      id: 'auto-participate-governance',
      name: 'Auto Participate Governance',
      description: 'Automatically participate in governance proposals',
      enabled: false,
      conditions: {
        minScore: 70,
        type: 'Governance Activity'
      },
      status: 'inactive'
    },
    {
      id: 'auto-bridge-assets',
      name: 'Auto Bridge Assets',
      description: 'Automatically bridge assets for cross-chain opportunities',
      enabled: false,
      conditions: {
        minScore: 75,
        type: 'Bridge Event'
      },
      status: 'inactive'
    },
    {
      id: 'auto-liquidity-provision',
      name: 'Auto Liquidity Provision',
      description: 'Automatically provide liquidity for new pools',
      enabled: true,
      conditions: {
        minScore: 85,
        type: 'Liquidity Event'
      },
      status: 'active'
    }
  ]);

  const [faucets, setFaucets] = useState<Faucet[]>([]);
  const [userAddress, setUserAddress] = useState<string>('');
  const [loadingFaucets, setLoadingFaucets] = useState(true);
  const [requestingFunds, setRequestingFunds] = useState<string | null>(null); // Stores faucet ID being requested

  const [deployments] = useState([
    {
      id: 'deploy-001',
      contract: 'StakingRewards',
      chain: 'Local Anvil',
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      timestamp: '2023-06-15T14:30:00Z',
      status: 'verified'
    },
    {
      id: 'deploy-002',
      contract: 'GovernanceToken',
      chain: 'Hardhat Network',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      timestamp: '2023-06-15T13:45:00Z',
      status: 'verified'
    }
  ]);

  useEffect(() => {
    const fetchFaucets = async () => {
      try {
        const response = await fetch('/api/faucets');
        if (!response.ok) {
          throw new Error('Failed to fetch faucets');
        }
        const data: Faucet[] = await response.json();
        setFaucets(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load faucets: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoadingFaucets(false);
      }
    };

    fetchFaucets();
  }, [toast]);

  const toggleRule = (id: string) => {
    setAutomationRules(automationRules.map(rule => 
      rule.id === id 
        ? { ...rule, enabled: !rule.enabled, status: !rule.enabled ? 'active' : 'inactive' } 
        : rule
    ));
    
    const rule = automationRules.find(r => r.id === id);
    if (rule) {
      toast({
        title: `${rule.enabled ? 'Disabled' : 'Enabled'} Automation Rule`,
        description: `${rule.name} has been ${rule.enabled ? 'disabled' : 'enabled'}.`
      });
    }
  };

  const requestFaucetFunds = async (faucetId: string, chainId: string) => {
    if (!userAddress) {
      toast({
        title: "Missing Address",
        description: "Please enter your wallet address to request funds.",
        variant: "destructive",
      });
      return;
    }

    setRequestingFunds(faucetId);
    try {
      const response = await fetch('/api/faucets/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chainId, address: userAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Faucet Request Sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Faucet Request Failed",
          description: data.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to request funds: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setRequestingFunds(null);
    }
  };

  const activeRules = automationRules.filter(r => r.enabled).length;

  const formatCooldown = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours >= 24 && hours % 24 === 0) {
      return `${hours / 24} day${hours / 24 > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automation</h1>
            <p className="text-gray-600">Manage automated testnet and devnet operations</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <Bot className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">{activeRules} Active Rules</span>
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Automation Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <Card key={rule.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            {rule.name}
                            <Badge 
                              variant={rule.status === 'active' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {rule.status}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Min Score: {rule.conditions.minScore}
                        </Badge>
                        <Badge variant="outline">
                          Type: {rule.conditions.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Testnet Faucets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Your wallet address (e.g., 0x...)"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="w-full"
                  />
                </div>
                {loadingFaucets ? (
                  <div className="text-center text-gray-500">Loading faucets...</div>
                ) : (
                  <div className="space-y-4">
                    {faucets.map((faucet) => (
                      <div key={faucet.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{faucet.name}</div>
                          <div className="text-sm text-gray-500">
                            Chain ID: {faucet.chainId} • {faucet.token} • Cooldown: {formatCooldown(faucet.cooldown)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={faucet.cooldown > 0 ? 'default' : 'secondary'}>
                            {faucet.cooldown > 0 ? 'Available' : 'No Cooldown'}
                          </Badge>
                          <Button 
                            size="sm" 
                            onClick={() => requestFaucetFunds(faucet.id, faucet.chainId)}
                            disabled={requestingFunds === faucet.id || !userAddress}
                          >
                            {requestingFunds === faucet.id ? 'Requesting...' : 'Request'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{deployment.contract}</div>
                        <div className="text-sm text-gray-500">
                          {deployment.chain} • {new Date(deployment.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={deployment.status === 'verified' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automation;