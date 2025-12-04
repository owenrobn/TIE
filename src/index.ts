// index.ts
import { TIEEngine } from './modules/engine/TIEEngine';
import { TAEEngine } from './modules/automation/TAEEngine';
import { AutomationEngine } from './modules/automation/AutomationEngine'; // Import AutomationEngine
import { DatabaseService } from './storage/DatabaseService'; // Import DatabaseService
import { EVMAdapter } from './modules/adapters/EVMAdapter'; // Import EVMAdapter for AutomationEngine
import app from './api/server'; // Import the configured Express app

// Initialize DatabaseService
const databaseService = new DatabaseService();

// Initialize TIE Engine, TAEEngine, and AutomationEngine
const tieEngine = new TIEEngine(databaseService);
const taeEngine = new TAEEngine();

// Mock EVMAdapter for AutomationEngine constructor
const mockEVMAdapter = new EVMAdapter('http://localhost:8545', '31337');
const automationEngine = new AutomationEngine(tieEngine, mockEVMAdapter);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await automationEngine.stop(); // Stop AutomationEngine
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await automationEngine.stop(); // Stop AutomationEngine
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

// Start the engines
// Connect to the database before starting TIEEngine
databaseService.connect().then(() => {
  tieEngine.start().catch(console.error);
  taeEngine.start().catch(console.error);
  automationEngine.start().catch(console.error); // Start AutomationEngine
}).catch(console.error);

export default app;