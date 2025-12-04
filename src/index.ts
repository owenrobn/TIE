// index.ts
import { TIEEngine } from './modules/engine/TIEEngine';
import { TAEEngine } from './modules/automation/TAEEngine';
import { AutomationEngine } from './modules/automation/AutomationEngine'; // Import AutomationEngine
import { DatabaseService } from './storage/DatabaseService'; // Import DatabaseService
import app from './api/server'; // Import the configured Express app

// Initialize DatabaseService
const databaseService = new DatabaseService();

// Initialize AutomationEngine first, as TAEEngine depends on it
const automationEngine = new AutomationEngine(databaseService);

// Initialize TIE Engine, TAEEngine
const tieEngine = new TIEEngine(databaseService);
const taeEngine = new TAEEngine(databaseService, automationEngine); // Pass DatabaseService and AutomationEngine

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop();
  await databaseService.disconnect(); // Disconnect DB on shutdown
  process.exit(0);
});

// Start the engines
// Connect to the database before starting TIEEngine
databaseService.connect().then(async () => {
  await automationEngine.initialize(); // Initialize AutomationEngine to load rules
  tieEngine.start().catch(console.error);
  taeEngine.start().catch(console.error);
}).catch(console.error);

export default app;