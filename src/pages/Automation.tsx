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
  Zap,
  Upload,
  CheckCircle,
  XCircle,
  Network
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Faucet {
  id: string;
  name: string;
  url: string;
  chainId: string;
  token: string;
  cooldown: number; // in milliseconds
}

interface DevnetConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: string;
}

interface Deployment {
  id: string;
  devnetId: string;
  contractName: string;
  contractAddress: string;
  deployer: string;
  timestamp: string;
  status?: 'verified' | 'unverified' | 'failed';
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
  const [requestingFunds, setRequestingFunds] = useState<string | null>(null);

  const [devnets, setDevnets] = useState<DevnetConfig[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loadingDevnets, setLoadingDevnets] = useState(true);
  const [loadingDeployments, setLoadingDeployments] = useState(true);

  const [deployForm, setDeployForm] = useState({
    devnetId: '',
    contractName: '',
    bytecode: '',
    abi: '',
    constructorArgs: ''
  });
  const [verifyingForm, setVerifyingForm] = useState({
    devnetId: '',
    contractAddress: '',
    contractName: '',
    sourceCode: ''
  });
  const [deploying, setDeploying] = useState(false);
  const [verifying, setVerifying] = useState(false);

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

    const fetchDevnets = async () => {
      try {
        const response = await fetch('/api/devnets');
        if (!response.ok) {
          throw new Error('Failed to fetch devnets');
        }
        const data: DevnetConfig[] = await response.json();
        setDevnets(data);
        if (data.length > 0) {
          setDeployForm(prev => ({ ...prev, devnetId: data[0].id }));
          setVerifyingForm(prev => ({ ...prev, devnetId: data[0].id }));
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load devnets: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoadingDevnets(false);
      }
    };

    const fetchDeployments = async () => {
      try {
        const response = await fetch('/api/deployments');
        if (!response.ok) {
          throw new Error('Failed to fetch deployments');
        }
        const data: Deployment[] = await response.json();
        setDeployments(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load deployments: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoadingDeployments(false);
      }
    };

    fetchFaucets();
    fetchDevnets();
    fetchDeployments();
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

  const handleDeployContract = async () => {
    if (!deployForm.devnetId || !deployForm.contractName || !deployForm.bytecode || !deployForm.abi) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for contract deployment.",
        variant: "destructive",
      });
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          devnetId: deployForm.devnetId,
          contractName: deployForm.contractName,
          bytecode: deployForm.bytecode,
          abi: JSON.parse(deployForm.abi),
          constructorArgs: deployForm.constructorArgs ? JSON.parse(deployForm.constructorArgs) : []
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Deployment Successful",
          description: `Contract ${deployForm.contractName} deployed at ${data.contractAddress}`,
        });
        // Refresh deployments list
        const updatedDeploymentsResponse = await fetch('/api/deployments');
        const updatedDeployments: Deployment[] = await updatedDeploymentsResponse.json();
        setDeployments(updatedDeployments);
        setDeployForm({
          devnetId: devnets.length > 0 ? devnets[0].id : '',
          contractName: '',
          bytecode: '',
          abi: '',
          constructorArgs: ''
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: data.message || "An unknown error occurred during deployment.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to deploy contract: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleVerifyContract = async () => {
    if (!verifyingForm.devnetId || !verifyingForm.contractAddress || !verifyingForm.contractName || !verifyingForm.sourceCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for contract verification.",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          devnetId: verifyingForm.devnetId,
          contractAddress: verifyingForm.contractAddress,
          contractName: verifyingForm.contractName,
          sourceCode: verifyingForm.sourceCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Successful",
          description: data.message,
        });
        // Update status of the verified contract in deployments
        setDeployments(prevDeployments => 
          prevDeployments.map(dep => 
            dep.contractAddress === verifyingForm.contractAddress && dep.devnetId === verifyingForm.devnetId
              ? { ...dep, status: 'verified' }
              : dep
          )
        );
        setVerifyingForm({
          devnetId: devnets.length > 0 ? devnets[0].id : '',
          contractAddress: '',
          contractName: '',
          sourceCode: ''
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "An unknown error occurred during verification.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to verify contract: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
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
                <CardTitle className="flex items-center">
                  <Network className="h-5 w-5 mr-2" />
                  Devnet Deployer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Deploy Contract</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="devnet-select">Devnet</Label>
                    <Select
                      value={deployForm.devnetId}
                      onValueChange={(value) => setDeployForm(prev => ({ ...prev, devnetId: value }))}
                      disabled={loadingDevnets}
                    >
                      <SelectTrigger id="devnet-select">
                        <SelectValue placeholder="Select a devnet" />
                      </SelectTrigger>
                      <SelectContent>
                        {devnets.map(devnet => (
                          <SelectItem key={devnet.id} value={devnet.id}>
                            {devnet.name} ({devnet.rpcUrl})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contract-name">Contract Name</Label>
                    <Input
                      id="contract-name"
                      value={deployForm.contractName}
                      onChange={(e) => setDeployForm(prev => ({ ...prev, contractName: e.target.value }))}
                      placeholder="MyToken"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bytecode">Bytecode</Label>
                    <Textarea
                      id="bytecode"
                      value={deployForm.bytecode}
                      onChange={(e) => setDeployForm(prev => ({ ...prev, bytecode: e.target.value }))}
                      placeholder="0x6080604052..."
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="abi">ABI (JSON)</Label>
                    <Textarea
                      id="abi"
                      value={deployForm.abi}
                      onChange={(e) => setDeployForm(prev => ({ ...prev, abi: e.target.value }))}
                      placeholder='[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"}]'
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="constructor-args">Constructor Arguments (JSON Array)</Label>
                    <Input
                      id="constructor-args"
                      value={deployForm.constructorArgs}
                      onChange={(e) => setDeployForm(prev => ({ ...prev, constructorArgs: e.target.value }))}
                      placeholder='["arg1", 123]'
                    />
                  </div>
                  <Button onClick={handleDeployContract} disabled={deploying}>
                    {deploying ? 'Deploying...' : <><Upload className="h-4 w-4 mr-2" /> Deploy Contract</>}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Verify Contract</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="verify-devnet-select">Devnet</Label>
                    <Select
                      value={verifyingForm.devnetId}
                      onValueChange={(value) => setVerifyingForm(prev => ({ ...prev, devnetId: value }))}
                      disabled={loadingDevnets}
                    >
                      <SelectTrigger id="verify-devnet-select">
                        <SelectValue placeholder="Select a devnet" />
                      </SelectTrigger>
                      <SelectContent>
                        {devnets.map(devnet => (
                          <SelectItem key={devnet.id} value={devnet.id}>
                            {devnet.name} ({devnet.rpcUrl})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="verify-contract-address">Contract Address</Label>
                    <Input
                      id="verify-contract-address"
                      value={verifyingForm.contractAddress}
                      onChange={(e) => setVerifyingForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                      placeholder="0x..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="verify-contract-name">Contract Name</Label>
                    <Input
                      id="verify-contract-name"
                      value={verifyingForm.contractName}
                      onChange={(e) => setVerifyingForm(prev => ({ ...prev, contractName: e.target.value }))}
                      placeholder="MyToken"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="source-code">Source Code</Label>
                    <Textarea
                      id="source-code"
                      value={verifyingForm.sourceCode}
                      onChange={(e) => setVerifyingForm(prev => ({ ...prev, sourceCode: e.target.value }))}
                      placeholder="// SPDX-License-Identifier: MIT..."
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleVerifyContract} disabled={verifying}>
                    {verifying ? 'Verifying...' : <><CheckCircle className="h-4 w-4 mr-2" /> Verify Contract</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDeployments ? (
                  <div className="text-center text-gray-500">Loading deployments...</div>
                ) : (
                  <div className="space-y-4">
                    {deployments.length === 0 ? (
                      <p className="text-center text-gray-500">No deployments found.</p>
                    ) : (
                      deployments.map((deployment) => (
                        <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{deployment.contractName}</div>
                            <div className="text-sm text-gray-500">
                              {devnets.find(d => d.id === deployment.devnetId)?.name || deployment.devnetId} • {new Date(deployment.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs font-mono text-gray-600 mt-1">
                              {deployment.contractAddress.substring(0, 6)}...{deployment.contractAddress.substring(deployment.contractAddress.length - 4)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={deployment.status === 'verified' ? 'default' : deployment.status === 'failed' ? 'destructive' : 'secondary'}>
                              {deployment.status || 'unverified'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automation;