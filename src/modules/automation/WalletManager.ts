// WalletManager.ts
import { v4 as uuidv4 } from 'uuid';

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

  constructor() {
    this.wallets = [
      {
        id: uuidv4(),
        address: '0xWallet1Address', // Mock address
        privateKey: '0xMockPrivateKey1', // Mock private key
        persona: { name: 'Explorer', behaviorProfile: 'normal', chains: ['Ethereum Sepolia', 'Arbitrum Nitro'] },
        lastUsed: null,
      },
      {
        id: uuidv4(),
        address: '0xWallet2Address', // Mock address
        privateKey: '0xMockPrivateKey2', // Mock private key
        persona: { name: 'Hunter', behaviorProfile: 'aggressive', chains: ['Optimism Goerli', 'Base Goerli'] },
        lastUsed: null,
      },
      {
        id: uuidv4(),
        address: '0xWallet3Address', // Mock address
        privateKey: '0xMockPrivateKey3', // Mock private key
        persona: { name: 'Farmer', behaviorProfile: 'passive', chains: ['Ethereum Sepolia', 'Polygon Mumbai'] },
        lastUsed: null,
      },
    ];
  }

  getWallets(): Wallet[] {
    return this.wallets;
  }

  selectWallet(signal: any): Wallet | null {
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
    return selectedWallet;
  }

  addWallet(address: string, privateKey: string, persona: Wallet['persona']): Wallet {
    const newWallet: Wallet = {
      id: uuidv4(),
      address,
      privateKey,
      persona,
      lastUsed: null,
    };
    this.wallets.push(newWallet);
    return newWallet;
  }

  removeWallet(id: string): boolean {
    const initialLength = this.wallets.length;
    this.wallets = this.wallets.filter(wallet => wallet.id !== id);
    return this.wallets.length < initialLength;
  }
}