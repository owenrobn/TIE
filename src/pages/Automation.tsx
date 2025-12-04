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
            <p className="text-muted-foreground">Configure automated actions and manage testnet resources</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button onClick={() => openRuleDialog()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
            <Button onClick={() => openWalletDialog()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TAE Status</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {taeStatus?.running ? 'Running' : 'Stopped'}
              </div>
              <p className="text-xs text-muted-foreground">
                Queue size: {taeStatus?.queueSize ?? 'N/A'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRulesCount}</div>
              <p className="text-xs text-muted-foreground">
                {automationRules.length - activeRulesCount} inactive
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallets.length}</div>
              <p className="text-xs text-muted-foreground">
                Last used: {getRelativeTime(taeStatus?.lastExecution)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Signal</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getRelativeTime(taeStatus?.lastSignalReceived)}
              </div>
              <p className="text-xs text-muted-foreground">
                {taeStatus?.queueSize} signals in queue
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAutomationRules ? (
                <div className="text-center text-muted-foreground">Loading automation rules...</div>
              ) : (
                <div className="space-y-4">
                  {automationRules.length === 0 ? (
                    <p className="text-center text-muted-foreground">No automation rules configured.</p>
                  ) : (
                    automationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium flex items-center">
                            {rule.name}
                            <Badge 
                              variant={rule.enabled ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {rule.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            Min Score: {rule.conditions.minScore}, Type: {rule.conditions.type}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openRuleDialog(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id, rule.name)}>
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

          <Card>
            <CardHeader>
              <CardTitle>Managed Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWallets ? (
                <div className="text-center text-muted-foreground">Loading wallets...</div>
              ) : (
                <div className="space-y-4">
                  {wallets.length === 0 ? (
                    <p className="text-center text-muted-foreground">No wallets added yet.</p>
                  ) : (
                    wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{wallet.persona.name} ({wallet.persona.behaviorProfile})</div>
                          <div className="text-sm text-muted-foreground">{wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}</div>
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
                          <Button variant="destructive" size="sm" onClick={() => handleRemoveWallet(wallet.id, wallet.address)}>
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
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Testnet Faucets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="userAddress" className="mb-2 block">Your Wallet Address</Label>
              <Input 
                id="userAddress"
                placeholder="0x..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
              />
            </div>
            {loadingFaucets ? (
              <div className="text-center text-muted-foreground">Loading faucets...</div>
            ) : (
              <div className="space-y-4">
                {faucets.length === 0 ? (
                  <p className="text-center text-muted-foreground">No testnet faucets configured.</p>
                ) : (
                  faucets.map((faucet) => (
                    <div key={faucet.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{faucet.name} ({faucet.token})</div>
                        <div className="text-sm text-muted-foreground">{faucet.url}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Cooldown: {formatCooldown(faucet.cooldown)}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => requestFaucetFunds(faucet.id, faucet.chainId)}
                        disabled={requestingFunds === faucet.id}
                      >
                        {requestingFunds === faucet.id ? 'Requesting...' : 'Request Funds'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Devnet Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDeployments ? (
                <div className="text-center text-muted-foreground">Loading deployments...</div>
              ) : (
                <div className="space-y-4">
                  {deployments.length === 0 ? (
                    <p className="text-center text-muted-foreground">No contracts deployed yet.</p>
                  ) : (
                    deployments.map((deployment) => (
                      <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{deployment.contractName}</div>
                          <div className="text-sm text-muted-foreground">
                            {deployment.contractAddress.substring(0, 6)}...{deployment.contractAddress.substring(deployment.contractAddress.length - 4)} on {deployment.devnetId}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Deployed by {deployment.deployer} {getRelativeTime(deployment.timestamp)}
                          </div>
                        </div>
                        <Badge variant={deployment.status === 'verified' ? 'default' : deployment.status === 'failed' ? 'destructive' : 'secondary'}>
                          {deployment.status || 'unverified'}
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
              <CardTitle>Deploy & Verify Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="deployDevnet">Devnet</Label>
                <Select
                  value={deployForm.devnetId}
                  onValueChange={(value) => setDeployForm(prev => ({ ...prev, devnetId: value }))}
                  disabled={loadingDevnets}
                >
                  <SelectTrigger id="deployDevnet">
                    <SelectValue placeholder="Select a devnet" />
                  </SelectTrigger>
                  <SelectContent>
                    {devnets.map(devnet => (
                      <SelectItem key={devnet.id} value={devnet.id}>
                        {devnet.name} ({devnet.chainId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contractName">Contract Name</Label>
                <Input 
                  id="contractName" 
                  placeholder="MyToken" 
                  value={deployForm.contractName}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, contractName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bytecode">Bytecode</Label>
                <Textarea 
                  id="bytecode" 
                  placeholder="0x..." 
                  value={deployForm.bytecode}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, bytecode: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="abi">ABI (JSON)</Label>
                <Textarea 
                  id="abi" 
                  placeholder='[{"type":"constructor",...}]' 
                  value={deployForm.abi}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, abi: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="constructorArgs">Constructor Args (JSON Array)</Label>
                <Input 
                  id="constructorArgs" 
                  placeholder='["arg1", 123]' 
                  value={deployForm.constructorArgs}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, constructorArgs: e.target.value }))}
                />
              </div>
              <Button onClick={handleDeployContract} disabled={deploying}>
                {deploying ? 'Deploying...' : 'Deploy Contract'}
              </Button>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="text-lg font-semibold">Verify Deployed Contract</h3>
                <div className="grid gap-2">
                  <Label htmlFor="verifyDevnet">Devnet</Label>
                  <Select
                    value={verifyingForm.devnetId}
                    onValueChange={(value) => setVerifyingForm(prev => ({ ...prev, devnetId: value }))}
                    disabled={loadingDevnets}
                  >
                    <SelectTrigger id="verifyDevnet">
                      <SelectValue placeholder="Select a devnet" />
                    </SelectTrigger>
                    <SelectContent>
                      {devnets.map(devnet => (
                        <SelectItem key={devnet.id} value={devnet.id}>
                          {devnet.name} ({devnet.chainId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contractAddress">Contract Address</Label>
                  <Input 
                    id="contractAddress" 
                    placeholder="0x..." 
                    value={verifyingForm.contractAddress}
                    onChange={(e) => setVerifyingForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="verifyContractName">Contract Name</Label>
                  <Input 
                    id="verifyContractName" 
                    placeholder="MyToken" 
                    value={verifyingForm.contractName}
                    onChange={(e) => setVerifyingForm(prev => ({ ...prev, contractName: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sourceCode">Source Code</Label>
                  <Textarea 
                    id="sourceCode" 
                    placeholder="// SPDX-License-Identifier: MIT..." 
                    value={verifyingForm.sourceCode}
                    onChange={(e) => setVerifyingForm(prev => ({ ...prev, sourceCode: e.target.value }))}
                  />
                </div>
                <Button onClick={handleVerifyContract} disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify Contract'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExecutionHistory ? (
                <div className="text-center text-muted-foreground">Loading execution history...</div>
              ) : (
                <div className="space-y-4">
                  {executionHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground">No executions recorded yet.</p>
                  ) : (
                    executionHistory.map((exec) => (
                      <div key={exec.signalId + exec.timestamp} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            Signal: {exec.signalId.substring(0, 8)}...
                            <Badge 
                              variant={exec.result.success ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {exec.result.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Wallet: {exec.walletAddress.substring(0, 6)}...{exec.walletAddress.substring(exec.walletAddress.length - 4)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(exec.timestamp).toLocaleString()}
                          </div>
                          {exec.result.txHash && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Tx Hash: {exec.result.txHash.substring(0, 10)}...
                            </div>
                          )}
                          {exec.result.error && (
                            <div className="text-xs text-red-500 mt-1">
                              Error: {exec.result.error}
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
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
                    failedSignals.map((failed) => (
                      <div key={failed.signal.signal_id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            Signal: {failed.signal.signal_id.substring(0, 8)}... ({failed.signal.type})
                            <Badge 
                              variant="destructive"
                              className="ml-2"
                            >
                              Failed
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Chain: {failed.signal.chain} | Score: {failed.signal.score}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Attempts: {failed.retries} | Last Attempt: {getRelativeTime(failed.lastAttempt || failed.addedAt)}
                          </div>
                          {failed.error && (
                            <div className="text-xs text-red-500 mt-1">
                              Error: {failed.error}
                            </div>
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

        {/* Rule Management Dialog */}
        <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Automation Rule' : 'Add New Automation Rule'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ruleName" className="text-right">
                  Name
                </Label>
                <Input
                  id="ruleName"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ruleDescription" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="ruleDescription"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minScore" className="text-right">
                  Min Score
                </Label>
                <Input
                  id="minScore"
                  type="number"
                  value={ruleForm.minScore}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="signalType" className="text-right">
                  Signal Type
                </Label>
                <Select
                  value={ruleForm.type}
                  onValueChange={(value) => setRuleForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="signalType" className="col-span-3">
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
                <Label htmlFor="ruleEnabled" className="text-right">
                  Enabled
                </Label>
                <Switch
                  id="ruleEnabled"
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

        {/* Wallet Management Dialog */}
        <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingWallet ? 'Edit Wallet' : 'Add New Wallet'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="walletAddress" className="text-right">
                  Address
                </Label>
                <Input
                  id="walletAddress"
                  value={walletForm.address}
                  onChange={(e) => setWalletForm(prev => ({ ...prev, address: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="privateKey" className="text-right">
                  Private Key
                </Label>
                <Input
                  id="privateKey"
                  type="password"
                  value={walletForm.privateKey}
                  onChange={(e) => setWalletForm(prev => ({ ...prev, privateKey: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personaName" className="text-right">
                  Persona Name
                </Label>
                <Input
                  id="personaName"
                  value={walletForm.personaName}
                  onChange={(e) => setWalletForm(prev => ({ ...prev, personaName: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="behaviorProfile" className="text-right">
                  Behavior Profile
                </Label>
                <Select
                  value={walletForm.behaviorProfile}
                  onValueChange={(value) => setWalletForm(prev => ({ ...prev, behaviorProfile: value as 'normal' | 'aggressive' | 'passive' }))}
                >
                  <SelectTrigger id="behaviorProfile" className="col-span-3">
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="passive">Passive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="chains" className="text-right">
                  Chains
                </Label>
                <Select
                  value={walletForm.chains[0]} // Only single select for simplicity
                  onValueChange={(value) => setWalletForm(prev => ({ ...prev, chains: [value] }))}
                >
                  <SelectTrigger id="chains" className="col-span-3">
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ethereum Sepolia">Ethereum Sepolia</SelectItem>
                    <SelectItem value="Arbitrum Nitro">Arbitrum Nitro</SelectItem>
                    <SelectItem value="Optimism Goerli">Optimism Goerli</SelectItem>
                    <SelectItem value="Base Goerli">Base Goerli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveWallet}>{editingWallet ? 'Save Changes' : 'Add Wallet'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Automation;