// index.ts
import { TIEEngine } from './modules/engine/TIEEngine';
import app from './api/server';

// Initialize and start the TIE Engine
const tieEngine = new TIEEngine();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await tieEngine.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await tieEngine.stop();
  process.exit(0);
});

// Start the engine
tieEngine.start().catch(console.error);

export default app;