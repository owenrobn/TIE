// AutomationEngine.ts
import { TIEEngine } from '../engine/TIEEngine';
import { EVMAdapter } from '../adapters/EVMAdapter';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { DatabaseService } from '../../storage/DatabaseService'; // Import DatabaseService

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    minScore: number;
    type: string;
  };
  status: 'active' | 'inactive'; // Added status for UI consistency
}

export class AutomationEngine {
  private tieEngine: TIEEngine;
  private evmAdapter: EVMAdapter;
  private simulationEngine: SimulationEngine;
  private databaseService: DatabaseService; // Inject DatabaseService
  private running: boolean;
  private automationRules: AutomationRule[]; // Will be loaded from DB

  constructor(tieEngine: TIEEngine, evmAdapter: EVMAdapter, databaseService: DatabaseService) {
    this.tieEngine = tieEngine;
    this.evmAdapter = evmAdapter;
    this.simulationEngine = new SimulationEngine();
    this.databaseService = databaseService; // Assign DatabaseService
    this.running = false;
    this.automationRules = []; // Initialize empty, will load from DB
  }

  private async loadAutomationRules(): Promise<void> {
    const storedRules = await this.databaseService.getAutomationRules();
    this.automationRules = storedRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      conditions: rule.conditions,
      status: rule.status as 'active' | 'inactive'
    }));
    console.log(`Loaded ${this.automationRules.length} automation rules from database.`);
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log('Automation Engine is already running');
      return;
    }

    this.running = true;
    console.log('Starting Automation Engine...');
    await this.loadAutomationRules(); // Load rules on startup

    // Start listening for signals
    this.listenForSignals();
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log('Stopping Automation Engine...');
  }

  private async listenForSignals(): Promise<void> {
    // In a real implementation, this would subscribe to a message queue or webhook
    // For demo purposes, we'll simulate receiving signals
    while (this.running) {
      try {
        // Simulate receiving a signal
        const signal = await this.receiveSignal();
        if (signal) {
          await this.processSignal(signal);
        }
        
        // Wait before checking for next signal
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error in signal listener:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async receiveSignal(): Promise<any | null> {
    // Simulate receiving signals with 30% probability
    if (Math.random() > 0.3) {
      return null;
    }

    // Generate a random signal for demo
    const signalTypes = [
      'Staking Reward Spike',
      'Governance Activity',
      'Bridge Event',
      'Liquidity Event',
      'New Contract Deployment'
    ];

    const chains = [
      'Ethereum Sepolia',
      'Arbitrum Nitro',
      'Optimism Goerli',
      'Base Goerli',
      'Polygon Mumbai'
    ];

    const randomType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const randomChain = chains[Math.floor(Math.random() * chains.length)];
    const randomScore = Math.floor(Math.random() * 40) + 60; // 60-100

    return {
      id: `sig-${Date.now()}`,
      chain: randomChain,
      type: randomType,
      contract: `0x${Math.random().toString(16).substr(2, 40)}`,
      score: randomScore,
      urgency: randomScore > 85 ? 'High' : randomScore > 70 ? 'Medium' : 'Low',
      timestamp: new Date().toISOString(),
      detector: 'AutomationEngine'
    };
  }

  private async processSignal(signal: any): Promise<void> {
    console.log('Processing signal for automation:', signal);

    // Check if any automation rules match
    for (const rule of this.automationRules) {
      if (!rule.enabled) continue;

      // Check if signal meets rule conditions
      if (this.matchesRule(signal, rule)) {
        console.log(`Executing automation rule: ${rule.name}`);
        await this.executeAutomation(signal, rule);
      }
    }
  }

  private matchesRule(signal: any, rule: AutomationRule): boolean {
    // Check signal type
    if (rule.conditions.type && signal.type !== rule.conditions.type) {
      return false;
    }

    // Check minimum score
    if (rule.conditions.minScore && signal.score < rule.conditions.minScore) {
      return false;
    }

    return true;
  }

  private async executeAutomation(signal: any, rule: AutomationRule): Promise<void> {
    try {
      console.log(`Executing automation for signal ${signal.id} with rule ${rule.name}`);

      // Simulate automation execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Different automation actions based on rule type
      switch (rule.conditions.type) { // Use rule.conditions.type for action logic
        case 'Staking Reward Spike':
          await this.claimStakingRewards(signal);
          break;
        case 'Governance Activity':
          await this.participateInGovernance(signal);
          break;
        case 'Bridge Event':
          await this.bridgeAssets(signal);
          break;
        case 'Liquidity Event':
          await this.provideLiquidity(signal);
          break;
        default:
          console.log('Unknown automation rule type, skipping execution');
      }

      console.log(`Automation executed successfully for rule: ${rule.name}`);
    } catch (error) {
      console.error(`Failed to execute automation for rule ${rule.name}:`, error);
      throw error;
    }
  }

  private async claimStakingRewards(signal: any): Promise<void> {
    console.log(`Claiming staking rewards on ${signal.chain} for contract ${signal.contract}`);
    
    // In a real implementation, this would:
    // 1. Connect to the chain
    // 2. Check reward balance
    // 3. Submit claim transaction
    // 4. Monitor transaction status
    
    // Simulate the process
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Staking rewards claimed successfully');
  }

  private async participateInGovernance(signal: any): Promise<void> {
    console.log(`Participating in governance on ${signal.chain} for contract ${signal.contract}`);
    
    // In a real implementation, this would:
    // 1. Fetch proposal details
    // 2. Analyze proposal content
    // 3. Submit vote transaction
    
    // Simulate the process
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Governance participation completed');
  }

  private async bridgeAssets(signal: any): Promise<void> {
    console.log(`Bridging assets for opportunity on ${signal.chain}`);
    
    // In a real implementation, this would:
    // 1. Check asset balances
    // 2. Select optimal bridge route
    // 3. Execute bridge transaction
    // 4. Monitor bridge status
    
    // Simulate the process
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Assets bridged successfully');
  }

  private async provideLiquidity(signal: any): Promise<void> {
    console.log(`Providing liquidity for new pool on ${signal.chain} for contract ${signal.contract}`);
    // Simulate the process
    await new Promise(resolve => setTimeout(resolve, 2500));
    console.log('Liquidity provided successfully');
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    await this.loadAutomationRules(); // Ensure rules are fresh
    return this.automationRules;
  }

  async getAutomationRuleById(ruleId: string): Promise<AutomationRule | undefined> {
    await this.loadAutomationRules();
    return this.automationRules.find(r => r.id === ruleId);
  }

  async addRule(newRule: Omit<AutomationRule, 'id' | 'status'>): Promise<AutomationRule> {
    const ruleRecord = await this.databaseService.saveAutomationRule({
      name: newRule.name,
      description: newRule.description,
      enabled: newRule.enabled,
      conditions: newRule.conditions,
      status: newRule.enabled ? 'active' : 'inactive'
    });
    const addedRule: AutomationRule = {
      id: ruleRecord.id,
      name: ruleRecord.name,
      description: ruleRecord.description,
      enabled: ruleRecord.enabled,
      conditions: ruleRecord.conditions,
      status: ruleRecord.status as 'active' | 'inactive'
    };
    this.automationRules.push(addedRule); // Update in-memory cache
    console.log(`Automation rule ${addedRule.name} added.`);
    return addedRule;
  }

  async updateRule(ruleId: string, updates: Partial<Omit<AutomationRule, 'id'>>): Promise<AutomationRule | undefined> {
    const updatedRecord = await this.databaseService.updateAutomationRule(ruleId, {
      name: updates.name,
      description: updates.description,
      enabled: updates.enabled,
      conditions: updates.conditions,
      status: updates.enabled !== undefined ? (updates.enabled ? 'active' : 'inactive') : undefined
    });

    if (updatedRecord) {
      const updatedRule: AutomationRule = {
        id: updatedRecord.id,
        name: updatedRecord.name,
        description: updatedRecord.description,
        enabled: updatedRecord.enabled,
        conditions: updatedRecord.conditions,
        status: updatedRecord.status as 'active' | 'inactive'
      };
      const index = this.automationRules.findIndex(r => r.id === ruleId);
      if (index !== -1) {
        this.automationRules[index] = updatedRule; // Update in-memory cache
      }
      console.log(`Automation rule ${ruleId} updated`);
      return updatedRule;
    }
    return undefined;
  }

  async toggleRule(ruleId: string): Promise<AutomationRule | undefined> {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (rule) {
      const newEnabledState = !rule.enabled;
      const updatedRecord = await this.databaseService.updateAutomationRule(ruleId, {
        enabled: newEnabledState,
        status: newEnabledState ? 'active' : 'inactive'
      });
      if (updatedRecord) {
        rule.enabled = newEnabledState;
        rule.status = newEnabledState ? 'active' : 'inactive';
        console.log(`Automation rule ${rule.name} is now ${rule.enabled ? 'enabled' : 'disabled'}`);
        return rule;
      }
    }
    return undefined;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const success = await this.databaseService.deleteAutomationRule(ruleId);
    if (success) {
      this.automationRules = this.automationRules.filter(r => r.id !== ruleId); // Update in-memory cache
      console.log(`Automation rule ${ruleId} deleted.`);
    }
    return success;
  }
}