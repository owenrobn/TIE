// server.ts
import express, { Request, Response } from 'express';
import { TIEEngine } from '../modules/engine/TIEEngine';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize TIE Engine
const tieEngine = new TIEEngine();

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

// Start the engine
tieEngine.start().catch(console.error);

// Start the server
app.listen(port, () => {
  console.log(`TIE API server running at http://localhost:${port}`);
});

export default app;