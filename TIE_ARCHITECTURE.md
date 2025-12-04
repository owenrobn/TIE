# Testnet Intelligence Engine (TIE) - Architecture Document

## ✅ 1. High-Level Architecture Outputs

### A. Full Engine Architecture

The Testnet Intelligence Engine (TIE) is a modular, event-driven system designed to discover, analyze, rank, and signal profitable testnet opportunities. The architecture consists of the following layers:

#### System Layers:
1. **Data Ingestion Layer** - Chain adapters and event listeners
2. **Processing Layer** - Detectors, simulation engine, and scoring engine
3. **Decision Layer** - Signal dispatcher and automation sandbox
4. **Storage Layer** - Database and caching systems
5. **Interface Layer** - APIs and UI components

#### Component Interactions:
- Chain Adapters → Detectors → Simulation Engine → Scoring Engine → Signal Dispatcher
- Signal Dispatcher → Automation Sandbox (for automated actions)
- All components → Database Layer (for persistence)
- Anti-Sybil Layer → All components (for behavior modification)

#### Core Modules:
1. **Chain Adapters** - Unified interface to different blockchain RPC/WSS endpoints
2. **Contract Fingerprinting Engine** - Classifies smart contracts based on ABI, bytecode, events, and behavior
3. **Testnet Opportunity Detectors** - Modular signals that identify economic opportunities
4. **MEV Detectors** - Identifies MEV-style opportunities on testnets
5. **Simulation Engine** - Local EVM fork-based simulation to test interaction sequences
6. **Scoring Engine** - Ranks opportunities based on multiple factors
7. **Signal Dispatcher** - Sends signed signals to automation engines
8. **Automation Sandbox** - Optional module for low-risk automated actions
9. **API Layer** - RESTful endpoints for external integration
10. **Database Layer** - PostgreSQL for persistent storage
11. **Anti-Sybil Layer** - Behavioral variation logic to minimize detection risk

#### Module Responsibilities:
- **Chain Adapters**: Handle all blockchain communication
- **Fingerprinting Engine**: Analyze and classify contracts
- **Detectors**: Identify opportunities in real-time
- **Simulation Engine**: Test interactions safely
- **Scoring Engine**: Rank opportunities objectively
- **Signal Dispatcher**: Communicate findings securely
- **Automation Sandbox**: Execute low-risk automated actions
- **API Layer**: Provide external access to engine data
- **Database Layer**: Store persistent data
- **Anti-Sybil Layer**: Modify behavior to avoid detection

### B. System Diagrams

#### Component Diagram:
```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIE ENGINE                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Chain       │  │ Contract         │  │ Testnet              │  │
│  │ Adapters    │  │ Fingerprinting   │  │ Detectors            │  │
│  │             │  │ Engine           │  │                      │  │
│  │ • EVM       │  │ • ABI Analysis   │  │ • NewChainDetector   │  │
│  │ • Solana    │  │ • Bytecode       │  │ • NewContract        │  │
│  │ • Cosmos    │  │   Analysis       │  │ • StakingReward      │  │
│  │ • Move      │  │ • Event          │  │ • BridgeEvent        │  │
│  └─────────────┘  │   Pattern        │  │ • Governance         │  │
│                   │   Recognition    │  │ • Liquidity          │  │
│  ┌─────────────┐  │ • Behavior       │  │   Bootstrapping      │  │
│  │ MEV         │  │   Analysis       │  │                      │  │
│  │ Detectors   │  └──────────────────┘  └──────────────────────┘  │
│  │             │  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ • Price     │  │ Simulation       │  │ Scoring Engine       │  │
│  │   Mismatch  │  │ Engine           │  │                      │  │
│  │ • Oracle    │  │                  │  │ • Reward Depth       │  │
│  │   Lag       │  │ • Local Fork     │  │   Calculation        │  │
│  │ • Liquidity │  │   Management     │  │ • Capital            │  │
│  │   Imbalance │  │ • Transaction    │  │   Requirement        │  │
│  │ • Incentive │  │   Simulation     │  │   Impact             │  │
│  │   Misalign  │  │ • Profit         │  │ • Sybil Risk         │  │
│  │ • Liquidat  │  │   Estimation     │  │   Calculation        │  │
│  │   ion       │  │ • Gas Estimation │  │ • Urgency Factors    │  │
│  └─────────────┘  └──────────────────┘  │ • Confidence Factors │  │
│                   ┌──────────────────┐  │ • Final Score        │  │
│  ┌─────────────┐  │ Signal           │  │   Computation        │  │
│  │ Automation  │  │ Dispatcher       │  └──────────────────────┘  │
│  │ Sandbox     │  │                  │  ┌──────────────────────┐  │
│  │             │  │ • HMAC Signing   │  │ Anti-Sybil Layer     │  │
│  │ • Auto      │  │ • Webhook        │  │                      │  │
│  │   Claim     │  │   Dispatch       │  │ • Behavior Variation  │  │
│  │   Rewards   │  │ • Secure         │  │ • Gas Strategy       │  │
│  │ • Auto      │  │   Communication  │  │   Diversification   │  │
│  │   Particip  │  └──────────────────┘  │ • Wallet Personality  │  │
│  │   ate       │  ┌──────────────────┐  │   Modeling           │  │
│  │   Governance│  │ APIs             │  │ • Pattern Separation │  │
│  │ • Auto      │  │                  │  │ • Risk Thresholds    │  │
│  │   Bridge    │  │ • REST Endpoints │  └──────────────────────┘  │
│  │   Assets    │  │ • Signal         │  ┌──────────────────────┐  │
│  └─────────────┘  │   Management     │  │ Database Layer       │  │
│                   │ • Detector       │  │                      │  │
│  ┌─────────────┐  │   Control        │  │ • PostgreSQL         │  │
│  │ API Layer   │  └──────────────────┘  │ • Schema Design      │  │
│  │             │                          │ • Migration          │  │
│  │ • REST      │                          │   Scripts           │  │
│  │ • Webhooks  │                          └──────────────────────┘  │
│  │ • GraphQL   │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Flow Diagram:
```
Blockchain Events → Chain Adapters → Detectors → Simulation Engine → Scoring Engine → Signal Dispatcher → Automation Sandbox
      ↑                    ↓              ↓              ↓                  ↓                ↓                  ↓
      └────────────── Configuration ←────┴──────────────┴──────────────────┴────────────────┴──────────────────┘
```

#### Event Pipeline:
1. **Event Ingestion**: Chain adapters subscribe to blockchain events
2. **Detection**: Detectors process events and identify opportunities
3. **Simulation**: Simulation engine tests potential interactions
4. **Scoring**: Scoring engine ranks opportunities
5. **Signal Generation**: Signal dispatcher creates signed signals
6. **Action Execution**: Automation sandbox executes approved actions
7. **Persistence**: All data stored in database

#### Chain Adapter Layout:
```
TIE Engine
├── EVM Adapters
│   ├── Ethereum Mainnet
│   ├── Ethereum Testnets (Sepolia, Holesky)
│   ├── Arbitrum (One, Nova, Testnets)
│   ├── Optimism (OP Mainnet, Testnets)
│   ├── Base (Mainnet, Testnets)
│   └── Polygon (Mainnet, Mumbai, Amoy)
├── Solana Adapters
│   ├── Mainnet Beta
│   └── Devnet
├── Cosmos Adapters
│   ├── Cosmos Hub
│   ├── Osmosis
│   └── Testnets
└── Move Adapters
    ├── Aptos
    └── Sui
```

## ✅ 2. Modules to Expect

### Core Components

#### 1. Chain Adapters
**Description**: Unified interface to different blockchain RPC/WSS endpoints
**Functions**:
- Subscribe to blocks and events
- Fetch contract ABIs
- Get account balances
- Simulate transactions
- Fetch gas data
- Fetch blockchain state
- Fetch event logs
**Requirements**:
- Support for multiple chain types (EVM, Solana, Cosmos, Move)
- WebSocket and HTTP fallback mechanisms
- Rate limiting and retry logic
- Error handling and recovery
**Logic**:
- Abstract base class with chain-specific implementations
- Connection pooling for efficiency
- Automatic reconnection on network failures

#### 2. Contract Fingerprinting Engine
**Description**: Classifies smart contracts based on ABI, bytecode, events, and behavior
**Functions**:
- Analyze contract bytecode patterns
- Parse and analyze contract ABIs
- Identify function signatures and event patterns
- Classify contract types (AMM, Staking, Governance, etc.)
- Calculate risk scores
**Requirements**:
- Support for multiple contract types
- Extensible classification system
- Efficient pattern matching algorithms
**Logic**:
- Signature-based classification
- Behavior pattern recognition
- Risk assessment algorithms

#### 3. Testnet Opportunity Detectors
**Description**: Modular signals that identify economic opportunities
**Functions**:
- Detect new testnets and devnets
- Identify new contract deployments
- Monitor staking reward spikes
- Track bridge events
- Monitor governance activity
- Detect liquidity bootstrapping events
**Requirements**:
- Configurable detection intervals
- Pluggable detector architecture
- Real-time event processing
**Logic**:
- Event-driven detection mechanisms
- Configurable thresholds and filters
- Stateful detection to avoid duplicates

#### 4. MEV Detectors
**Description**: Identifies MEV-style opportunities on testnets
**Functions**:
- Detect price mismatches
- Monitor oracle delays
- Identify liquidity imbalances
- Track incentive misalignments
- Find liquidation opportunities
**Requirements**:
- Low-latency processing
- Accurate arbitrage calculations
- Cross-chain opportunity identification
**Logic**:
- Real-time market data analysis
- Arbitrage opportunity calculation
- Profitability threshold checking

#### 5. Simulation Engine
**Description**: Local EVM fork-based simulation to test interaction sequences
**Functions**:
- Run local blockchain forks
- Simulate transaction sequences
- Estimate gas usage and costs
- Calculate potential profits
- Handle simulation errors
**Requirements**:
- Support for multiple local fork tools (Anvil, Hardhat)
- Concurrent simulation capabilities
- Detailed result reporting
**Logic**:
- Fork management and lifecycle
- Transaction simulation pipeline
- Result aggregation and analysis

#### 6. Scoring Engine
**Description**: Ranks opportunities based on multiple factors
**Functions**:
- Calculate reward depth
- Assess capital requirements
- Evaluate sybil risk
- Factor in urgency and confidence
- Compute final scores
**Requirements**:
- Configurable scoring weights
- Real-time scoring updates
- Risk-adjusted scoring
**Logic**:
- Multi-factor scoring algorithm
- Dynamic weight adjustment
- Risk normalization

#### 7. Signal Dispatcher
**Description**: Sends signed signals to automation engines
**Functions**:
- Create signed signal payloads
- Dispatch signals via webhooks
- Handle dispatch errors
- Log dispatch events
**Requirements**:
- Cryptographically secure signing
- Reliable delivery mechanisms
- Error handling and retries
**Logic**:
- HMAC-SHA256 payload signing
- Webhook delivery with confirmation
- Dispatch queue management

#### 8. Automation Sandbox
**Description**: Optional module for low-risk automated actions
**Functions**:
- Execute approved automated actions
- Manage testnet faucet requests
- Handle contract deployments
- Monitor execution results
**Requirements**:
- Secure execution environment
- Configurable automation rules
- Execution logging and monitoring
**Logic**:
- Rule-based execution engine
- Risk assessment before execution
- Result verification and reporting

#### 9. APIs
**Description**: RESTful endpoints for external integration
**Functions**:
- Expose signal data
- Provide detector status
- Allow configuration updates
- Handle webhook callbacks
**Requirements**:
- RESTful design principles
- JSON data format
- Authentication and authorization
**Logic**:
- CRUD operations for core entities
- Real-time data streaming
- Secure authentication mechanisms

#### 10. Database Layer
**Description**: PostgreSQL for persistent storage
**Functions**:
- Store contract fingerprints
- Persist signal data
- Track execution history
- Manage configuration
**Requirements**:
- ACID compliance
- Scalable schema design
- Efficient querying
**Logic**:
- Normalized database schema
- Indexing strategies
- Migration management

#### 11. Anti-Sybil Layer
**Description**: Behavioral variation logic to minimize detection risk
**Functions**:
- Modify execution timing
- Vary gas strategies
- Model wallet personalities
- Separate behavioral patterns
**Requirements**:
- Configurable behavior models
- Risk threshold management
- Pattern separation algorithms
**Logic**:
- Randomization algorithms
- Behavior modeling
- Risk assessment

## ✅ 3. All Detectors You Should See

### Testnet Detectors

#### 1. NewChainDetector
**Detection Logic**: Monitors blockchain explorers and RPC endpoints for new chain announcements
**Example Triggers**: 
- New RPC endpoint becomes available
- Genesis block mined on new testnet
- Chain ID registered on multi-chain registries
**Inputs/Outputs**:
- Input: RPC endpoint lists, chain registry data
- Output: New chain detection signals with metadata
**Pseudo-code**:
```
FOR each known chain registry
  FETCH latest chain announcements
  IF new chain detected
    VERIFY chain accessibility
    CREATE signal with chain metadata
  END IF
END FOR
```

#### 2. NewContractDeploymentDetector
**Detection Logic**: Subscribes to block events and analyzes new contract deployments
**Example Triggers**:
- New contract deployed with significant bytecode
- Contract with recognizable function signatures
- Deployment with high-value constructor parameters
**Inputs/Outputs**:
- Input: Block subscription events, contract bytecode
- Output: New contract deployment signals with analysis
**Pseudo-code**:
```
ON new block
  FOR each transaction in block
    IF contract creation transaction
      FETCH contract bytecode and ABI
      ANALYZE with fingerprinting engine
      IF high potential detected
        CREATE signal with contract details
      END IF
    END IF
  END FOR
END ON
```

#### 3. StakingRewardSpikeDetector
**Detection Logic**: Monitors staking contracts for unusual reward distributions
**Example Triggers**:
- Sudden increase in reward rates
- New reward distribution event
- Unusual token transfer patterns from staking contracts
**Inputs/Outputs**:
- Input: Staking contract events, token transfer logs
- Output: Staking reward spike signals with analysis
**Pseudo-code**:
```
FOR each monitored staking contract
  SUBSCRIBE to reward distribution events
  MONITOR token transfer patterns
  IF reward spike detected
    CALCULATE potential returns
    CREATE signal with reward details
  END IF
END FOR
```

#### 4. BridgeEventDetector
**Detection Logic**: Tracks cross-chain bridge events for opportunities
**Example Triggers**:
- Large value transfers across bridges
- New bridge contract deployments
- Bridge fee changes or incentives
**Inputs/Outputs**:
- Input: Bridge contract events, cross-chain transaction data
- Output: Bridge event signals with profitability analysis
**Pseudo-code**:
```
FOR each monitored bridge contract
  SUBSCRIBE to bridge events
  MONITOR cross-chain transfers
  IF profitable opportunity detected
    CALCULATE arbitrage potential
    CREATE signal with bridge details
  END IF
END FOR
```

#### 5. GovernanceActivityDetector
**Detection Logic**: Monitors governance contracts for proposal activity
**Example Triggers**:
- New governance proposals
- High-stakes voting periods
- Emergency proposal submissions
**Inputs/Outputs**:
- Input: Governance contract events, proposal data
- Output: Governance activity signals with participation opportunities
**Pseudo-code**:
```
FOR each monitored governance contract
  SUBSCRIBE to proposal events
  MONITOR voting periods
  IF high-impact proposal detected
    ANALYZE proposal content
    CREATE signal with participation details
  END IF
END FOR
```

#### 6. LiquidityBootstrappingDetector
**Detection Logic**: Identifies new liquidity pools and bootstrapping events
**Example Triggers**:
- New AMM pool creation
- Liquidity mining program announcements
- Initial liquidity provision events
**Inputs/Outputs**:
- Input: AMM contract events, liquidity provision logs
- Output: Liquidity bootstrapping signals with reward analysis
**Pseudo-code**:
```
FOR each monitored AMM protocol
  SUBSCRIBE to pool creation events
  MONITOR liquidity provision events
  IF new pool with incentives detected
    CALCULATE potential returns
    CREATE signal with pool details
  END IF
END FOR
```

### MEV Detectors

#### 1. PriceMismatchDetector
**Detection Logic**: Identifies price inefficiencies across exchanges
**Example Triggers**:
- Price deviation exceeding threshold
- Arbitrage opportunity with positive expected value
- Sudden price movements on single exchange
**Inputs/Outputs**:
- Input: Price feeds from multiple exchanges
- Output: Price mismatch signals with arbitrage details
**Pseudo-code**:
```
FOR each token pair
  FETCH prices from all monitored exchanges
  CALCULATE price deviations
  IF deviation exceeds threshold
    SIMULATE arbitrage transaction
    CREATE signal with profit estimate
  END IF
END FOR
```

#### 2. OracleLagDetector
**Detection Logic**: Monitors oracle delays for arbitrage opportunities
**Example Triggers**:
- Significant oracle price deviation from market price
- Oracle update delays exceeding threshold
- Stale oracle data detection
**Inputs/Outputs**:
- Input: Oracle price feeds, market price data
- Output: Oracle lag signals with exploitation opportunities
**Pseudo-code**:
```
FOR each monitored oracle
  FETCH oracle price
  FETCH market price
  CALCULATE deviation and staleness
  IF significant lag detected
    SIMULATE exploitation transaction
    CREATE signal with opportunity details
  END IF
END FOR
```

#### 3. LiquidityImbalanceDetector
**Detection Logic**: Identifies liquidity imbalances for sandwich attack opportunities
**Example Triggers**:
- Large pending transactions
- Low liquidity pools with high-value trades
- Concentrated liquidity positions
**Inputs/Outputs**:
- Input: Mempool transactions, liquidity pool data
- Output: Liquidity imbalance signals with attack vectors
**Pseudo-code**:
```
MONITOR mempool for large transactions
FOR each large transaction
  ANALYZE affected liquidity pools
  IF imbalance exploitable
    SIMULATE sandwich attack
    CREATE signal with profit estimate
  END IF
END FOR
```

#### 4. IncentiveMisalignmentDetector
**Detection Logic**: Finds protocol incentive structures that can be exploited
**Example Triggers**:
- Reward programs with flawed mechanics
- Governance incentives with unintended consequences
- Liquidity mining with perverse incentives
**Inputs/Outputs**:
- Input: Protocol documentation, contract analysis
- Output: Incentive misalignment signals with exploitation strategies
**Pseudo-code**:
```
FOR each monitored protocol
  ANALYZE incentive structures
  IDENTIFY potential misalignments
  IF exploitable misalignment found
    SIMULATE exploitation strategy
    CREATE signal with strategy details
  END IF
END FOR
```

#### 5. LiquidationOpportunityDetector
**Detection Logic**: Identifies undercollateralized positions for liquidation
**Example Triggers**:
- Positions near liquidation thresholds
- Oracle manipulation opportunities
- Flash loan liquidation possibilities
**Inputs/Outputs**:
- Input: Position data, price feeds, oracle data
- Output: Liquidation opportunity signals with profit estimates
**Pseudo-code**:
```
FOR each monitored lending protocol
  FETCH position data
  CALCULATE liquidation thresholds
  IF undercollateralized positions found
    SIMULATE liquidation transaction
    CREATE signal with profit estimate
  END IF
END FOR
```

## ✅ 4. Simulation Engine Details

### How to Simulate Transactions
The simulation engine uses local EVM forks to safely test transactions without affecting the main network. It:
1. Creates a fork of the target chain at a specific block
2. Executes transactions in a controlled environment
3. Captures all state changes and events
4. Calculates gas usage, profits, and risks

### How to Run Local Forks (Foundry/Hardhat)
The engine supports multiple local fork tools:
- **Foundry/Anvil**: `anvil --fork-url <RPC_URL> --port 8545`
- **Hardhat Network**: `npx hardhat node --fork <RPC_URL>`

### Simulation Outputs
Each simulation returns:
- Success/failure status
- Gas used and cost
- State changes
- Events emitted
- Profit/loss calculation
- Error details (if any)

### Simulation Structure
```
SimulationRequest {
  chain: string,
  blockNumber: number,
  transactions: Transaction[],
  gasPrice: string,
  slippageTolerance: number
}

SimulationResult {
  success: boolean,
  gasUsed: number,
  gasCost: string,
  profit: string,
  stateChanges: StateChange[],
  events: Event[],
  error?: string
}
```

### Error Handling
- Transaction reverts are caught and analyzed
- Gas estimation failures trigger alternative strategies
- Timeout errors result in simulation retries
- Persistent errors are logged for manual review

### Slippage/Gas/Profit Estimation
- Slippage is calculated based on pool depth and trade size
- Gas costs are estimated using current network conditions
- Profit is calculated as (output_value - input_cost - gas_cost) * confidence_factor

## ✅ 5. Scoring Engine Outputs

### Scoring Formula
```
final_score = 0.35*reward_depth + 0.25*urgency + 0.20*confidence - 0.10*sybil_risk - 0.10*capital_requirement
```

### Reward Depth Logic
Reward depth is calculated based on:
- Potential token rewards
- Historical reward distribution patterns
- Protocol sustainability metrics
- Market value of reward tokens

### Capital Requirement Impact
Capital requirements are assessed by:
- Minimum transaction amounts
- Position sizing requirements
- Collateral needs
- Opportunity cost of capital

### Sybil Risk Calculation
Sybil risk factors include:
- Behavioral pattern analysis
- Address reputation scoring
- Transaction velocity monitoring
- Network-wide activity correlation

### Urgency + Confidence Factors
- **Urgency**: Time-sensitive opportunities score higher
- **Confidence**: Based on historical accuracy and signal strength

### Final Score Computation
Scores are normalized to 0-100 scale with configurable thresholds for signal dispatch.

## ✅ 6. Signal Structure

### Signal Payload Format
```json
{
  "signal_id": "uuid",
  "timestamp": "ISO8601",
  "chain": "string",
  "detector": "string",
  "context": {
    "type": "string",
    "description": "string",
    "contract_address": "string",
    "parameters": {}
  },
  "simulation": {
    "success": true,
    "gas_used": 21000,
    "profit_estimate": "0.01 ETH",
    "risk_assessment": "low"
  },
  "score": {
    "final": 85,
    "reward_depth": 0.9,
    "urgency": 0.8,
    "confidence": 0.85,
    "sybil_risk": 0.1,
    "capital_requirement": 0.2
  },
  "recommended_action": "string",
  "signed_header": "HMAC signature"
}
```

### Signal JSON Body
The complete signal includes all metadata needed for automated processing while maintaining security through cryptographic signing.

## ✅ 7. API Endpoints You Should See

### GET /signals
**Request**: `GET /api/signals?limit=50&status=new`
**Response**: Array of signal objects with pagination

### POST /webhook/receive
**Request**: `POST /api/webhook/receive` with signed signal payload
**Response**: Acknowledgment of signal receipt

### GET /detectors/status
**Request**: `GET /api/detectors/status`
**Response**: Array of detector status objects

## ✅ 8. Database Schema

### contracts table
```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    chain VARCHAR(100),
    address VARCHAR(66),
    fingerprint JSONB,
    contract_type VARCHAR(100),
    created_at TIMESTAMP
);
```

### signals table
```sql
CREATE TABLE signals (
    id UUID PRIMARY KEY,
    chain VARCHAR(100),
    type VARCHAR(100),
    context JSONB,
    simulation JSONB,
    score JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP
);
```

### executions table
```sql
CREATE TABLE executions (
    id UUID PRIMARY KEY,
    signal_id UUID REFERENCES signals(id),
    executor VARCHAR(100),
    result JSONB,
    timestamp TIMESTAMP
);
```

## ✅ 9. Anti-Sybil Requirements

### Behavior Rules
- **Random Execution Timing**: Add random delays between actions
- **Wallet Behavior Variation**: Use different transaction patterns
- **Gas Strategy Diversification**: Vary gas prices and limits
- **Wallet Personality Modeling**: Simulate different user types
- **Pattern Separation**: Avoid repetitive behavioral patterns
- **Sybil Risk Thresholds**: Configurable risk tolerance levels

## ✅ 10. Performance Requirements

### Metrics
- **Detector Latency**: < 1 second per event
- **Simulation Time**: < 3 seconds average
- **Signal Dispatch Speed**: < 200 ms
- **WebSocket Reconnect Strategy**: Automatic retry with exponential backoff

## ✅ 11. Coding Standards

### Languages
- TypeScript for all core modules
- SQL for database migrations
- JSON for configuration

### Architecture
- Async/event-driven design
- Modular component structure
- Clear separation of concerns

### Folder Structure
```
src/
├── app/
├── modules/
│   ├── adapters/
│   ├── detectors/
│   ├── engine/
│   ├── fingerprinting/
│   ├── scoring/
│   ├── signals/
│   ├── simulation/
│   └── automation/
├── pages/
├── components/
├── api/
├── lib/
└── utils/
```

## ✅ 12. Folder Structure

### Full Tree
```
app/
├── layout.tsx
├── App.tsx
├── main.tsx
adapters/
├── ChainAdapter.ts
├── EVMAdapter.ts
detectors/
├── Detector.ts
├── NewChainDetector.ts
├── NewContractDeploymentDetector.ts
├── StakingRewardSpikeDetector.ts
engine/
├── TIEEngine.ts
fingerprinting/
├── ContractFingerprinter.ts
scoring/
├── ScoringEngine.ts
signals/
├── SignalDispatcher.ts
simulation/
├── SimulationEngine.ts
automation/
├── AutomationEngine.ts
├── TestnetFaucetManager.ts
├── DevnetDeployer.ts
api/
├── server.ts
storage/
├── database.ts
utils/
├── config.ts
```

## ✅ 13. Expected Outputs

### Full Codebase
- Complete TypeScript implementation of all modules
- React frontend with dashboard and management interfaces
- Configuration files and documentation

### Dockerfile
- Multi-stage build for production deployment
- Environment variable support
- Health check endpoints

### docker-compose
- Services for engine, database, and redis
- Network configuration
- Volume management

### API Routes
- RESTful endpoints for all core functionality
- Webhook receivers for external integrations
- Authentication and rate limiting

### Detectors Implemented
- All testnet and MEV detectors
- Configurable detection parameters
- Real-time event processing

### Simulation Engine Scaffold
- Local fork management
- Transaction simulation pipeline
- Result analysis and reporting

### Signal Handler
- Cryptographically secure signal generation
- Webhook dispatch with confirmation
- Error handling and retries

### Database Schema/Migrations
- PostgreSQL schema for all entities
- Migration scripts for version management
- Indexing strategies for performance

### Config Files
- Default and environment-specific configurations
- Secure secret management
- Runtime configuration updates

### Complete README
- Project overview and architecture
- Installation and setup instructions
- Usage examples and API documentation

### Architecture Docs
- Detailed component descriptions
- Data flow diagrams
- Performance benchmarks

## ✅ 14. Constraints

### Ethical Requirements
- No paid AI services for core functionality
- Only testnet-safe strategies implemented
- Low capital usage by design
- Modularity for easy extension and customization

### Technical Constraints
- All code must be open-source compatible
- No proprietary dependencies
- Cross-platform compatibility
- Extensible plugin architecture