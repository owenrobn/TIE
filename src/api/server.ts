"use client";

import express, { Request, Response } from 'express';
import { TIEEngine } from '../modules/engine/TIEEngine';
import { TestnetFaucetManager } from '../modules/automation/TestnetFaucetManager';
import { DevnetDeployer } from '../modules/automation/DevnetDeployer';
import { TAEEngine } from '../modules/automation/TAEEngine';
import { AutomationEngine } from '../modules/automation/AutomationEngine';
import { EVMAdapter } from '../modules/adapters/EVMAdapter';
import { DatabaseService } from '../storage/DatabaseService'; // Import DatabaseService

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize DatabaseService
const databaseService = new DatabaseService();

// Initialize TIE Engine, TestnetFaucetManager, DevnetDeployer, TAEEngine, and AutomationEngine
const tieEngine = new TIEEngine(databaseService); // Pass DatabaseService to TIEEngine
const faucetManager = new TestnetFaucetManager();
const devnetDeployer = new DevnetDeployer();
const taeEngine = new TAEEngine(databaseService); // Pass DatabaseService to TAEEngine

// Mock EVMAdapter for AutomationEngine constructor
const mockEVMAdapter = new EVMAdapter('http://localhost:8545', '31337');
const automationEngine = new AutomationEngine(tieEngine, mockEVMAdapter, databaseService); // Pass DatabaseService to AutomationEngine

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

app.post('/api/detectors/:name/toggle', async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    await tieEngine.toggleDetector(name);
    res.json({
      success: true,
      message: `Toggled detector ${name}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle detector.' });
  }
});

app.get('/api/signals', async (req: Request, res: Response) => {
  try {
    const signals = await tieEngine.getSignals(); // Fetch signals from TIEEngine (now from DB)
    res.json(signals);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch signals.' });
  }
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

// TAE API Routes
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

app.get('/api/tae/status', async (req: Request, res: Response) => {
  const status = await taeEngine.getEngineStatus(); // Await getEngineStatus
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

// TAE Wallet Management Routes
app.get('/api/tae/wallets', async (req: Request, res: Response) => {
  const wallets = await taeEngine.getWallets(); // Await getWallets
  res.json(wallets);
});

app.post('/api/tae/wallets', async (req: Request, res: Response) => {
  const { address, privateKey, persona } = req.body;
  if (!address || !privateKey || !persona) {
    return res.status(400).json({ success: false, message: 'Address, private key, and persona are required.' });
  }
  try {
    const newWallet = await taeEngine.addWallet(address, privateKey, persona); // Await addWallet
    res.status(201).json({ success: true, message: 'Wallet added successfully.', wallet: newWallet });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add wallet.' });
  }
});

app.delete('/api/tae/wallets/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const success = await taeEngine.removeWallet(id); // Await removeWallet
    if (success) {
      res.json({ success: true, message: `Wallet ${id} removed successfully.` });
    } else {
      res.status(404).json({ success: false, message: `Wallet ${id} not found.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to remove wallet.' });
  }
});

// Automation Rules API Routes
app.get('/api/automation/rules', async (req: Request, res: Response) => {
  const rules = await automationEngine.getAutomationRules(); // Await getAutomationRules
  res.json(rules);
});

app.post('/api/automation/rules', async (req: Request, res: Response) => {
  const { name, description, enabled, conditions } = req.body;
  if (!name || !description || conditions === undefined) {
    return res.status(400).json({ success: false, message: 'Name, description, and conditions are required.' });
  }
  try {
    const newRule = await automationEngine.addRule({ name, description, enabled: enabled ?? false, conditions }); // Await addRule
    res.status(201).json({ success: true, message: 'Automation rule added successfully.', rule: newRule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to add automation rule.' });
  }
});

app.put('/api/automation/rules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updatedRule = await automationEngine.updateRule(id, updates); // Await updateRule
    if (updatedRule) {
      res.json({ success: true, message: `Automation rule ${id} updated successfully.`, rule: updatedRule });
    } else {
      res.status(404).json({ success: false, message: `Automation rule ${id} not found.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update automation rule.' });
  }
});

app.post('/api/automation/rules/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const toggledRule = await automationEngine.toggleRule(id); // Await toggleRule
    if (toggledRule) {
      res.json({ success: true, message: `Automation rule ${id} toggled successfully.`, rule: toggledRule });
    } else {
      res.status(404).json({ success: false, message: `Automation rule ${id} not found.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle automation rule.' });
  }
});

app.delete('/api/automation/rules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const success = await automationEngine.deleteRule(id); // Await deleteRule
    if (success) {
      res.json({ success: true, message: `Automation rule ${id} deleted successfully.` });
    } else {
      res.status(404).json({ success: false, message: `Automation rule ${id} not found.` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete automation rule.' });
  }
});


// Start the engines
// Connect to the database before starting TIEEngine
databaseService.connect().then(() => {
  tieEngine.start().catch(console.error);
  taeEngine.start().catch(console.error);
  automationEngine.start().catch(console.error);
}).catch(console.error);


// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await automationEngine.stop();
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await automationEngine.stop();
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

// Start the server
app.listen(port, () => {
  console.log(`TIE API server running at http://localhost:${port}`);
});

export default app;