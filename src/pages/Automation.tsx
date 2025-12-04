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
  Network,
  Wallet,
  PlusCircle,
  Trash2,
  Clock,
  Edit,
  History,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

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

interface WalletData {
  id: string;
  address: string;
  privateKey: string;
  persona: {
    name: string;
    behaviorProfile: 'normal' | 'aggressive' | 'passive';
    chains: string[];
  };
  lastUsed: string | null;
}

interface TAEStatus {
  running: boolean;
  queueSize: number;
  walletsActive: number;
  lastSignalReceived: string | null;
  lastExecution: string | null;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    minScore: number;
    type: string;
  };
  status: 'active' | 'inactive';
}

interface ExecutionRecord {
  signalId: string;
  walletAddress: string;
  timestamp: string;
  result: {
    success: boolean;
    txHash?: string;
    gasUsed?: number;
    error?: string;
    output?: any;
  };
}

interface FailedSignal {
  signal: {
    signal_id: string;
    chain: string;
    type: string;
    context: {
      description: string;
      contract_address: string;
    };
    score: number;
  };
  priority: number;
  addedAt: string;
  retries: number;
  lastAttempt?: string;
  error?: string;
}

const Automation = () => {
  const { toast } = useToast();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [loadingAutomationRules, setLoadingAutomationRules] = useState(true);

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

  // TAE State
  const [taeStatus, setTaeStatus] = useState<TAEStatus | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loadingTaeStatus, setLoadingTaeStatus] = useState(true);
  const [loadingWallets, setLoadingWallets] = useState(true);
  
  // New state for executions and failed signals
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [loadingExecutionHistory, setLoadingExecutionHistory] = useState(true);
  const [failedSignals, setFailedSignals] = useState<FailedSignal[]>([]);
  const [loadingFailedSignals, setLoadingFailedSignals] = useState(true);


  // Rule Management Dialog State
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    minScore: 60,
    type: 'Staking Reward Spike',
    enabled: true
  });

  // Wallet Management Dialog State
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);
  const [walletForm, setWalletForm] = useState({
    id: '',
    address: '',
    privateKey: '',
    personaName: 'Explorer',
    behaviorProfile: 'normal' as 'normal' | 'aggressive' | 'passive',
    chains: ['Ethereum Sepolia']
  });

  const fetchAutomationRules = async () => {
    try {
      const response = await fetch('/api/automation/rules');
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      const data: AutomationRule[] = await response.json();
      setAutomationRules(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load automation rules: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingAutomationRules(false);
    }
  };

  const fetchTAEData = async () => {
    try {
      const statusResponse = await fetch('/api/tae/status');
      if (!statusResponse.ok) throw new Error('Failed to fetch TAE status');
      const statusData: TAEStatus = await statusResponse.json();
      setTaeStatus(statusData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load TAE status: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingTaeStatus(false);
    }

    try {
      const walletsResponse = await fetch('/api/tae/wallets');
      if (!walletsResponse.ok) throw new Error('Failed to fetch wallets');
      const walletsData: WalletData[] = await walletsResponse.json();
      setWallets(walletsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load wallets: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingWallets(false);
    }

    // Fetch execution history
    try {
      const executionsResponse = await fetch('/api/tae/executions');
      if (!executionsResponse.ok) throw new Error('Failed to fetch execution history');
      const executionsData: ExecutionRecord[] = await executionsResponse.json();
      setExecutionHistory(executionsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load execution history: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingExecutionHistory(false);
    }

    // Fetch failed signals
    try {
      const failedSignalsResponse = await fetch('/api/tae/queue/failed');
      if (!failedSignalsResponse.ok) throw new Error('Failed to fetch failed signals');
      const failedSignalsData: FailedSignal[] = await failedSignalsResponse.json();
      setFailedSignals(failedSignalsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load failed signals: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingFailedSignals(false);
    }
  };

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

    fetchAutomationRules();
    fetchFaucets();
    fetchDevnets();
    fetchDeployments();
    fetchTAEData(); // Fetch TAE data on component mount

    const interval = setInterval(fetchTAEData, 5000); // Refresh TAE status every 5 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const toggleRule = async (id: string) => {
    try {
      const response = await fetch(`/api/automation/rules/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle rule ${id}`);
      }

      const data = await response.json();
      toast({
        title: "Rule Toggled",
        description: data.message,
      });
      fetchAutomationRules(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to toggle rule: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteRule = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/automation/rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete rule ${id}`);
      }

      const data = await response.json();
      toast({
        title: "Rule Deleted",
        description: data.message,
      });
      fetchAutomationRules(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete rule: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name || !ruleForm.description || !ruleForm.type || ruleForm.minScore === undefined) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the automation rule.",
        variant: "destructive",
      });
      return;
    }

    const rulePayload = {
      name: ruleForm.name,
      description: ruleForm.description,
      enabled: ruleForm.enabled,
      conditions: {
        minScore: ruleForm.minScore,
        type: ruleForm.type
      }
    };

    try {
      let response;
      if (editingRule) {
        response = await fetch(`/api/automation/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rulePayload),
        });
      } else {
        response = await fetch('/api/automation/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rulePayload),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingRule ? 'update' : 'add'} rule.`);
      }

      const data = await response.json();
      toast({
        title: `Rule ${editingRule ? 'Updated' : 'Added'}`,
        description: data.message,
      });
      setIsRuleDialogOpen(false);
      fetchAutomationRules(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${editingRule ? 'update' : 'add'} rule: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const openRuleDialog = (rule?: AutomationRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        description: rule.description,
        minScore: rule.conditions.minScore,
        type: rule.conditions.type,
        enabled: rule.enabled
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        description: '',
        minScore: 60,
        type: 'Staking Reward Spike',
        enabled: true
      });
    }
    setIsRuleDialogOpen(true);
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

  const handleSaveWallet = async () => {
    if (!walletForm.address || !walletForm.privateKey || !walletForm.personaName || !walletForm.behaviorProfile || walletForm.chains.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the wallet.",
        variant: "destructive",
      });
      return;
    }

    const walletPayload = {
      address: walletForm.address,
      privateKey: walletForm.privateKey,
      persona: {
        name: walletForm.personaName,
        behaviorProfile: walletForm.behaviorProfile,
        chains: walletForm.chains
      }
    };

    try {
      let response;
      if (editingWallet) {
        response = await fetch(`/api/tae/wallets/${walletForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(walletPayload),
        });
      } else {
        response = await fetch('/api/tae/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(walletPayload),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingWallet ? 'update' : 'add'} wallet.`);
      }

      const data = await response.json();
      toast({
        title: `Wallet ${editingWallet ? 'Updated' : 'Added'}`,
        description: data.message,
      });
      setIsWalletDialogOpen(false);
      fetchTAEData(); // Refresh wallets list
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${editingWallet ? 'update' : 'add'} wallet: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const openWalletDialog = (wallet?: WalletData) => {
    if (wallet) {
      setEditingWallet(wallet);
      setWalletForm({
        id: wallet.id,
        address: wallet.address,
        privateKey: wallet.privateKey, // Note: Private key might not be returned by API for security
        personaName: wallet.persona.name,
        behaviorProfile: wallet.persona.behaviorProfile,
        chains: wallet.persona.chains
      });
    } else {
      setEditingWallet(null);
      setWalletForm({
        id: '',
        address: '',
        privateKey: '',
        personaName: 'Explorer',
        behaviorProfile: 'normal',
        chains: ['Ethereum Sepolia']
      });
    }
    setIsWalletDialogOpen(true);
  };

  const handleRemoveWallet = async (id: string, address: string) => {
    if (!window.confirm(`Are you sure you want to remove wallet ${address}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tae/wallets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Wallet Removed",
          description: data.message,
        });
        fetchTAEData(); // Refresh wallets list
      } else {
        toast({
          title: "Failed to Remove Wallet",
          description: data.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to remove wallet: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const activeRulesCount = automationRules.filter(r => r.enabled).length;

  const formatCooldown = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours >= 24 && hours % 24 === 0) {
      return `${hours / 24} day${hours / 24 > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const date = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds} sec ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const signalTypes = [
    'Staking Reward Spike',
    'Governance Activity',
    'Bridge Event',
    'Liquidity Event',
    'New Contract Deployment',
    'Price Mismatch',
    'Oracle Lag',
    'Liquidity Imbalance',
    'Incentive Misalignment',
    'Liquidation Opportunity'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automation</h1>
            <p className="text-muted-foreground">Manage automated testnet and devnet operations</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <Bot className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">{activeRulesCount} Active Rules</span>
            </div>
            <Button onClick={() => openRuleDialog()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Rule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TAE Status</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingTaeStatus ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : taeStatus ? (
                <div className="space-y-1">
                  <p className="text-2xl font-bold flex items-center">
                    {taeStatus.running ? <CheckCircle className="h-5 w-5 text-green-500 mr-2" /> : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    {taeStatus.running ? 'Running' : 'Stopped'}
                  </p>
                  <p className="text-sm text-muted-foreground">Queue Size: {taeStatus.queueSize}</p>
                  <p className="text-sm text-muted-foreground">Active Wallets: {taeStatus.walletsActive}</p>
                  <p className="text-sm text-muted-foreground">Last Signal: {getRelativeTime(taeStatus.lastSignalReceived)}</p>
                  <p className="text-sm text-muted-foreground">Last Execution: {getRelativeTime(taeStatus.lastExecution)}</p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">TAE status unavailable.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Automation Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAutomationRules ? (
                <div className="text-center text-muted-foreground">Loading rules...</div>
              ) : (
                <div className="space-y-4">
                  {automationRules.length === 0 ? (
                    <p className="text-center text-muted-foreground">No automation rules configured.</p>
                  ) : (
                    automationRules.map((rule) => (
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
                              <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                            </div>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline">
                              Min Score: {rule.conditions.minScore}
                            </Badge>
                            <Badge variant="outline">
                              Type: {rule.conditions.type}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openRuleDialog(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id, rule.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
                <div className="text-center text-muted-foreground">Loading faucets...</div>
              ) : (
                <div className="space-y-4">
                  {faucets.map((faucet) => (
                    <div key={faucet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{faucet.name}</div>
                        <div className="text-sm text-muted-foreground">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExecutionHistory ? (
                <div className="text-center text-muted-foreground">Loading execution history...</div>
              ) : (
                <div className="space-y-4">
                  {executionHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground">No recent executions.</p>
                  ) : (
                    executionHistory.slice(0, 5).map((execution) => ( // Show top 5 recent executions
                      <div key={execution.signalId + execution.timestamp} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium flex items-center">
                            {execution.result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            Signal: {execution.signalId.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wallet: {execution.walletAddress.substring(0, 6)}...{execution.walletAddress.substring(execution.walletAddress.length - 4)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(execution.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={execution.result.success ? 'default' : 'destructive'}>
                          {execution.result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Failed Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFailedSignals ? (
                <div className="text-center text-muted-foreground">Loading failed signals...</div>
              ) : (
                <div className="space-y-4">
                  {failedSignals.length === 0 ? (
                    <p className="text-center text-muted-foreground">No failed signals in queue.</p>
                  ) : (
                    failedSignals.map((failedSignal) => (
                      <div key={failedSignal.signal.signal_id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                            {failedSignal.signal.type} ({failedSignal.signal.chain})
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {failedSignal.signal.context.description}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            Retries: {failedSignal.retries} • Last Attempt: {getRelativeTime(failedSignal.lastAttempt || null)}
                          </div>
                          {failedSignal.error && (
                            <p className="text-xs text-red-400 mt-1">Error: {failedSignal.error}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Retry
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Managed Wallets
                </div>
                <Button onClick={() => openWalletDialog()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWallets ? (
                <div className="text-center text-muted-foreground">Loading wallets...</div>
              ) : (
                <div className="space-y-4">
                  {wallets.length === 0 ? (
                    <p className="text-center text-muted-foreground">No wallets configured for TAE.</p>
                  ) : (
                    wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{wallet.persona.name} ({wallet.persona.behaviorProfile})</div>
                          <div className="text-sm text-muted-foreground">
                            {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Chains: {wallet.persona.chains.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last Used: {getRelativeTime(wallet.lastUsed)}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openWalletDialog(wallet)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveWallet(wallet.id, wallet.address)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
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
                  <div className="text-center text-muted-foreground">Loading deployments...</div>
                ) : (
                  <div className="space-y-4">
                    {deployments.length === 0 ? (
                      <p className="text-center text-muted-foreground">No deployments found.</p>
                    ) : (
                      deployments.map((deployment) => (
                        <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{deployment.contractName}</div>
                            <div className="text-sm text-muted-foreground">
                              {devnets.find(d => d.id === deployment.devnetId)?.name || deployment.devnetId} • {new Date(deployment.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground mt-1">
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

      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Automation Rule' : 'Add New Automation Rule'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Name
              </Label>
              <Input
                id="rule-name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="rule-description"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-min-score" className="text-right">
                Min Score
              </Label>
              <Input
                id="rule-min-score"
                type="number"
                value={ruleForm.minScore}
                onChange={(e) => setRuleForm(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-type" className="text-right">
                Signal Type
              </Label>
              <Select
                value={ruleForm.type}
                onValueChange={(value) => setRuleForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="rule-type" className="col-span-3">
                  <SelectValue placeholder="Select signal type" />
                </SelectTrigger>
                <SelectContent>
                  {signalTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-enabled" className="text-right">
                Enabled
              </Label>
              <Switch
                id="rule-enabled"
                checked={ruleForm.enabled}
                onCheckedChange={(checked) => setRuleForm(prev => ({ ...prev, enabled: checked }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule}>{editingRule ? 'Save Changes' : 'Add Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingWallet ? 'Edit Wallet' : 'Add New Wallet'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-address" className="text-right">
                Address
              </Label>
              <Input
                id="wallet-address"
                value={walletForm.address}
                onChange={(e) => setWalletForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="0x..."
                className="col-span-3"
                disabled={!!editingWallet} {/* Disable address editing for existing wallets */}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-private-key" className="text-right">
                Private Key
              </Label>
              <Input
                id="wallet-private-key"
                type="password"
                value={walletForm.privateKey}
                onChange={(e) => setWalletForm(prev => ({ ...prev, privateKey: e.target.value }))}
                placeholder="0x..."
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-persona-name" className="text-right">
                Persona Name
              </Label>
              <Input
                id="wallet-persona-name"
                value={walletForm.personaName}
                onChange={(e) => setWalletForm(prev => ({ ...prev, personaName: e.target.value }))}
                placeholder="Explorer"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-behavior-profile" className="text-right">
                Behavior Profile
              </Label>
              <Select
                value={walletForm.behaviorProfile}
                onValueChange={(value: 'normal' | 'aggressive' | 'passive') => setWalletForm(prev => ({ ...prev, behaviorProfile: value }))}
              >
                <SelectTrigger id="wallet-behavior-profile" className="col-span-3">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem> {/* Corrected typo here */}
                  <SelectItem value="passive">Passive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wallet-chains" className="text-right">
                Chains (comma-separated)
              </Label>
              <Input
                id="wallet-chains"
                value={walletForm.chains.join(', ')}
                onChange={(e) => setWalletForm(prev => ({ ...prev, chains: e.target.value.split(',').map(c => c.trim()).filter(Boolean) }))}
                placeholder="Ethereum Sepolia, Arbitrum Nitro"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWallet}>{editingWallet ? 'Save Changes' : 'Add Wallet'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Automation;