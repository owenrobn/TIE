"use client";

import express, { Request, Response } from 'express';
import { TIEEngine } from '../modules/engine/TIEEngine';
import { TestnetFaucetManager } from '../modules/automation/TestnetFaucetManager'; // Import TestnetFaucetManager

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize TIE Engine and TestnetFaucetManager
const tieEngine = new TIEEngine();
const faucetManager = new TestnetFaucetManager(); // Instantiate TestnetFaucetManager

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
  // In a real implementation, this would fetch signals from a database
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
    }
  ];
  
  res.json(signals);
});

// New routes for Testnet Faucet Manager
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

// Start the engine
tieEngine.start().catch(console.error);

// Start the server
app.listen(port, () => {
  console.log(`TIE API server running at http://localhost:${port}`);
});

export default app;