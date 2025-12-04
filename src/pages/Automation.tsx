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
        <h1 className="text-3xl font-bold text-foreground">Automation Page</h1>
        <p className="text-muted-foreground">This is a simplified version for debugging.</p>
      </div>
    </div>
  );
};

export default Automation;