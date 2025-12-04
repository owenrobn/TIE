# Testnet Intelligence Engine (TIE)

A multi-chain engine that discovers, analyzes, ranks, and signals profitable testnet tasks, smart contract interactions, reward mechanisms, and multi-chain opportunities.

## Features

- **Multi-chain Support**: Works with EVM-compatible chains, Solana, Cosmos SDK, and Move chains
- **Opportunity Detection**: Identifies new testnets, contracts, staking rewards, and more
- **MEV Intelligence**: Detects price inefficiencies, oracle delays, and liquidity anomalies
- **Smart Contract Analysis**: Fingerprinting engine to classify contracts
- **Simulation Engine**: Local EVM fork-based simulation to test interactions
- **Scoring System**: Ranks opportunities based on profitability and risk
- **Signal Dispatch**: Sends signed signals to automation engines
- **Anti-Sybil Measures**: Behavioral variation logic to minimize detection risk

## Architecture

The TIE consists of several modular components:

1. **Chain Adapters**: Unified interface to different blockchain RPC/WSS endpoints
2. **Contract Fingerprinting Engine**: Classifies smart contracts based on ABI, bytecode, events, and behavior
3. **Detectors**: Modular signals that identify economic opportunities
4. **Simulation Engine**: Local EVM fork-based simulation to test interaction sequences
5. **Scoring Engine**: Ranks opportunities based on multiple factors
6. **Signal Dispatcher**: Sends signed signals to automation engines
7. **Automation Sandbox**: Optional module for low-risk automated actions

## Getting Started

### Prerequisites

- Node.js 16+
- Docker and Docker Compose (for easy setup)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tie-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run with Docker:
   ```bash
   docker-compose up -d
   ```

### Configuration

The engine can be configured through:
- Environment variables
- JSON configuration files in the `config/` directory
- Runtime API endpoints

Key configuration options include:
- RPC endpoints for different chains
- Database connection details
- Detector intervals and thresholds
- Security settings for webhook signing

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/detectors/status` - Get detector status
- `POST /api/detectors/:name/toggle` - Enable/disable a detector
- `GET /api/signals` - Fetch recent signals
- `POST /api/webhook/receive` - Receive signals (for automation engines)

## Development

### Project Structure

```
src/
├── app/           # Main application setup
├── modules/       # Core engine modules
│   ├── adapters/  # Chain adapters
│   ├── detectors/ # Detection modules
│   ├── engine/    # Main engine orchestration
│   ├── fingerprinting/ # Contract analysis
│   ├── scoring/   # Opportunity scoring
│   ├── signals/   # Signal dispatch
│   └── simulation/ # Transaction simulation
├── pages/         # UI pages
├── components/    # UI components
├── api/           # API endpoints
└── lib/           # Utility functions
```

### Adding New Detectors

1. Create a new detector class extending the base `Detector` class
2. Implement the `detect()` method to identify opportunities
3. Register the detector in the `TIEEngine` constructor
4. Add configuration options as needed

### Extending Chain Support

1. Create a new adapter extending `ChainAdapter`
2. Implement all required methods for the new chain type
3. Register the adapter in `TIEEngine.initializeChainAdapters()`

## Security

- All outgoing signals are signed with HMAC-SHA256
- Anti-Sybil measures include behavioral variation logic
- Configurable thresholds for automated actions
- Secure storage of API keys and secrets

## Performance

- Detector latency: < 1 second per event
- Simulation time: < 3 seconds average
- Signal dispatch: < 200 ms
- Automatic WebSocket reconnection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the blockchain community for testnet resources
- Inspired by MEV research and DeFi analytics