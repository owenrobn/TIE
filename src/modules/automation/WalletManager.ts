// WalletManager.ts
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../storage/DatabaseService'; // Import DatabaseService

interface Wallet {
  id: string;
  address: string;
  privateKey: string; // In a real app, this would be encrypted
  persona: {
    name: string;
    behaviorProfile: 'normal' | 'aggressive' | 'passive';
    chains: string[];
  };
  lastUsed: Date | null;
}

export class WalletManager {
  private wallets: Wallet[];
  private databaseService: DatabaseService; // Inject DatabaseService

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService; // Assign DatabaseService
    this.wallets = []; // Initialize empty, will load from DB
  }

  async loadWallets(): Promise<void> {
    const storedWallets = await this.databaseService.getWallets();
    this.wallets = storedWallets.map(w => ({
      id: w.id,
      address: w.address,
      privateKey: w.private_key,
      persona: w.persona,
      lastUsed: w.last_used ? new Date(w.last_used) : null,
    }));
    console.log(`Loaded ${this.wallets.length} wallets from database.`);
  }

  async getWallets(): Promise<Wallet[]> {
    await this.loadWallets(); // Ensure wallets are fresh
    return this.wallets;
  }

  async selectWallet(signal: any): Promise<Wallet | null> {
    await this.loadWallets(); // Ensure wallets are fresh
    // Simple selection logic: find an available wallet that supports the signal's chain
    // and hasn't been used recently, prioritizing less recently used wallets.
    const availableWallets = this.wallets.filter(w => w.persona.chains.includes(signal.chain));

    if (availableWallets.length === 0) {
      return null;
    }

    // Sort by lastUsed (oldest first)
    availableWallets.sort((a, b) => (a.lastUsed?.getTime() || 0) - (b.lastUsed?.getTime() || 0));

    const selectedWallet = availableWallets[0];
    selectedWallet.lastUsed = new Date(); // Update last used time
    
    // Persist the lastUsed update
    await this.databaseService.updateWallet(selectedWallet.id, {
      last_used: selectedWallet.lastUsed
    });

    return selectedWallet;
  }

  async addWallet(address: string, privateKey: string, persona: Wallet['persona']): Promise<Wallet> {
    const newWalletRecord = await this.databaseService.saveWallet({
      address,
      private_key: privateKey,
      persona,
      last_used: null,
    });
    const newWallet: Wallet = {
      id: newWalletRecord.id,
      address: newWalletRecord.address,
      privateKey: newWalletRecord.private_key,
      persona: newWalletRecord.persona,
      lastUsed: newWalletRecord.last_used ? new Date(newWalletRecord.last_used) : null,
    };
    this.wallets.push(newWallet); // Update in-memory cache
    return newWallet;
  }

  async removeWallet(id: string): Promise<boolean> {
    const success = await this.databaseService.deleteWallet(id);
    if (success) {
      this.wallets = this.wallets.filter(wallet => wallet.id !== id); // Update in-memory cache
      console.log(`Removed wallet configuration: ${id}`);
    }
    return success;
  }
}