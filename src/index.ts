// index.ts
import { TIEEngine } from './modules/engine/TIEEngine';
import { TAEEngine } from './modules/automation/TAEEngine'; // Import TAEEngine
import app from './api/server';

// Initialize and start the TIE Engine
const tieEngine = new TIEEngine();
const taeEngine = new TAEEngine(); // Initialize TAEEngine

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop(); // Stop TAEEngine
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await tieEngine.stop();
  await taeEngine.stop(); // Stop TAEEngine
  process.exit(0);
});

// Start the engines
tieEngine.start().catch(console.error);
taeEngine.start().catch(console.error); // Start TAEEngine

export default app;