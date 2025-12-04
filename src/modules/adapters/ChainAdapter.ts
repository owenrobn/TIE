// ChainAdapter.ts
export abstract class ChainAdapter {
  protected rpcUrl: string;
  protected chainId: string;

  constructor(rpcUrl: string, chainId: string) {
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
  }

  abstract subscribeBlocks(callback: (block: any) => void): void;
  abstract subscribeEvents(callback: (event: any) => void): void;
  abstract getContractABI(address: string): Promise<any>;
  abstract getBalance(address: string): Promise<string>;
  abstract simulateTransaction(txPayload: any): Promise<any>;
  abstract fetchGasData(): Promise<any>;
  abstract fetchState(slotOrBlock: string): Promise<any>;
  abstract fetchLogs(query: any): Promise<any[]>;
}