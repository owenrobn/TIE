"use client";

import express, { Request, Response } from 'express';
import { TIEEngine } from '../modules/engine/TIEEngine';
import { TestnetFaucetManager } from '../modules/automation/TestnetFaucetManager';
import { DevnetDeployer } from '../modules/automation/DevnetDeployer';
import { TAEEngine } from '../modules/automation/TAEEngine'; // Import TAEEngine

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize TIE Engine, TestnetFaucetManager, DevnetDeployer, and TAEEngine
const tieEngine = new TIEEngine();
const faucetManager = new TestnetFaucetManager();
const devnetDeployer = new DevnetDeployer();
const taeEngine = new TAEEngine(); // Initialize TAEEngine

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/detectors/status', (req: Request, res: Response) => {
  const status = tieEngine.getDetectorStatus();
  res.json(status);
});

app.post('/api/detectors/:name/toggle', (req: Request, res: Response) => {
  const { name } = req.params;
  tieEngine.toggleDetector(name);
  res.json({
    success: true,
    message: `Toggled detector ${name}`
  });
});

app.get('/api/signals', (req: Request, res: Response) => {
  // Expanded mock signals to reflect various detector types
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
    },
    {
      id: 'sig-005',
      chain: 'Ethereum Sepolia',
      type: 'Price Mismatch',
      contract: '0xabcde12345abcde12345abcde12345abcde12345',
      score: 90,
      urgency: 'High',
      timestamp: '2023-06-15T10:00:00Z',
      status: 'New',
      detector: 'PriceMismatchDetector'
    },
    {
      id: 'sig-006',
      chain: 'Arbitrum Nitro',
      type: 'Oracle Lag',
      contract: '0xfedcb12345fedcb12345fedcb12345fedcb12345',
      score: 88,
      urgency: 'Medium',
      timestamp: '2023-06-15T09:30:00Z',
      status: 'New',
      detector: 'OracleLagDetector'
    },
    {
      id: 'sig-007',
      chain: 'Base Goerli',
      type: 'Liquidation Opportunity',
      contract: '0x12345fedcba12345fedcba12345fedcba12345',
      score: 95,
      urgency: 'High',
      timestamp: '2023-06-15T08:00:00Z',
      status: 'New',
      detector: 'LiquidationOpportunityDetector'
    }
  ];
  
  res.json(signals);
});

// Routes for Testnet Faucet Manager
app.get('/api/faucets', (req: Request, res: Response) => {
  const faucets = faucetManager.getAvailableFaucets();
  res.json(faucets);
});

app.post('/api/faucets/request', async (req: Request, res: Response) => {
  const { chainId, address } = req.body;
  if (!chainId || !address) {
    return res.status(400).json({ success: false, message: 'Chain ID and address are required.' });
  }

  try {
    const success = await faucetManager.requestFunds(chainId, address);
    if (success) {
      res.json({ success: true, message: 'Funds requested successfully.' });
    } else {
      const nextAvailableTime = faucetManager.getNextAvailableTime(chainId, address);
      const timeLeft = Math.ceil((nextAvailableTime - Date.now()) / (60 * 60 * 1000));
      res.status(400).json({ success: false, message: `Cooldown period not expired. Please wait ${timeLeft} hours.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to request funds.' });
  }
});

// New routes for Devnet Deployer
app.get('/api/devnets', (req: Request, res: Response) => {
  const devnets = devnetDeployer.getDevnetConfigs();
  res.json(devnets);
});

app.get('/api/deployments', (req: Request, res: Response) => {
  const { devnetId } = req.query;
  const deployments = devnetDeployer.getDeployments(devnetId as string);
  res.json(deployments);
});

app.post('/api/deploy', async (req: Request, res: Response) => {
  const { devnetId, contractName, bytecode, abi, constructorArgs } = req.body;
  if (!devnetId || !contractName || !bytecode || !abi) {
    return res.status(400).json({ success: false, message: 'Devnet ID, contract name, bytecode, and ABI are required.' });
  }

  try {
    const contractAddress = await devnetDeployer.deployContract(devnetId, contractName, bytecode, abi, constructorArgs);
    res.json({ success: true, message: 'Contract deployed successfully.', contractAddress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to deploy contract.' });
  }
});

app.post('/api/verify', async (req: Request, res: Response) => {
  const { devnetId, contractAddress, contractName, sourceCode } = req.body;
  if (!devnetId || !contractAddress || !contractName || !sourceCode) {
    return res.status(400).json({ success: false, message: 'Devnet ID, contract address, contract name, and source code are required.' });
  }

  try {
    const success = await devnetDeployer.verifyContract(devnetId, contractAddress, contractName, sourceCode);
    if (success) {
      res.json({ success: true, message: 'Contract verified successfully.' });
    } else {
      res.status(400).json({ success: false, message: 'Contract verification failed.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to verify contract.' });
  }
});

// New TAE API Routes
app.post('/api/tae/signal', async (req: Request, res: Response) => {
  const signature = req.headers['x-mev-signature'] as string;
  if (!signature) {
    return res.status(401).json({ success: false, message: 'X-MEV-Signature header is required.' });
  }

  try {
    const success = await taeEngine.receiveSignal(req.body, signature);
    if (success) {
      res.json({ success: true, message: 'Signal received and processed.' });
    } else {
      res.status(400).json({ success: false, message: 'Signal processing failed or invalid signature.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to process signal.' });
  }
});

app.get('/api/tae/status', (req: Request, res: Response) => {
  const status = taeEngine.getEngineStatus();
  res.json(status);
});

app.post('/api/tae/execute/:signalId', (req: Request, res: Response) => {
  const { signalId } = req.params;
  const success = taeEngine.manuallyExecuteSignal(signalId);
  if (success) {
    res.json({ success: true, message: `Signal ${signalId} manually triggered for execution.` });
  } else {
    res.status(404).json({ success: false, message: `Signal ${signalId} not found in queue.` });
  }
});

// New TAE Wallet Management Routes
app.get('/api/tae/wallets', (req: Request, res: Response) => {
  const wallets = taeEngine.getWallets();
  res.json(wallets);
});

app.post('/api/tae/wallets', (req: Request, res: Response) => {
  const { address, privateKey, persona } = req.body;
  if (!address || !privateKey || !persona) {
    return res.status(400).json({ success: false, message: 'Address, private key, and persona are required.' });
  }
  try {
    const newWallet = taeEngine.addWallet(address, privateKey, persona);
    res.status(201).json({ success: true, message: 'Wallet added successfully.', wallet: newWallet });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add wallet.' });
  }
});

app.delete('/api/tae/wallets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const success = taeEngine.removeWallet(id);
    if (success) {
      res.json({ success: true, message: `Wallet ${id} removed successfully.` });
    } else {
      res.status(404).json({ success: false, message: `Wallet ${id} not found.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to remove wallet.' });
  }
});


// Start the engines
tieEngine.start().catch(console.error);
taeEngine.start().catch(console.error); // Start TAE Engine

// Start the server
app.listen(port, () => {
  console.log(`TIE API server running at http://localhost:${port}`);
});

export default app;