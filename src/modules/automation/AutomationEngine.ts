// AutomationEngine.ts
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
  private databaseService: DatabaseService; // Inject DatabaseService
  private automationRules: AutomationRule[]; // Will be loaded from DB

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService; // Assign DatabaseService
    this.automationRules = []; // Initialize empty, will load from DB
  }

  async initialize(): Promise<void> {
    await this.loadAutomationRules(); // Load rules on startup
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

  async getMatchingRules(signal: any): Promise<AutomationRule[]> {
    await this.loadAutomationRules(); // Ensure rules are fresh
    return this.automationRules.filter(rule => {
      if (!rule.enabled) return false;

      // Check signal type
      if (rule.conditions.type && signal.type !== rule.conditions.type) {
        return false;
      }

      // Check minimum score
      if (rule.conditions.minScore && signal.score < rule.conditions.minScore) {
        return false;
      }
      return true;
    });
  }
}