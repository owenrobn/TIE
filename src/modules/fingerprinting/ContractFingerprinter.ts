// ContractFingerprinter.ts
import { EVMAdapter } from '../adapters/EVMAdapter'; // Import EVMAdapter

export class ContractFingerprinter {
  private evmAdapter: EVMAdapter | null;

  constructor(evmAdapter: EVMAdapter | null = null) {
    this.evmAdapter = evmAdapter;
  }

  async fingerprintContract(address: string, bytecode: string, abi: any): Promise<any> {
    console.log(`Fingerprinting contract ${address}`);
    
    let contractAbi = abi;
    // If ABI is not provided, try to fetch it using the EVMAdapter
    if (!contractAbi && this.evmAdapter) {
      console.log(`ABI not provided for ${address}, attempting to fetch using EVMAdapter.`);
      try {
        contractAbi = await this.evmAdapter.getContractABI(address);
        if (contractAbi.length === 0) {
          console.warn(`Could not fetch ABI for ${address}. Fingerprinting with limited information.`);
        }
      } catch (error) {
        console.error(`Error fetching ABI for ${address} with EVMAdapter:`, error);
        contractAbi = []; // Ensure contractAbi is an array even on error
      }
    } else if (!contractAbi) {
      console.warn(`ABI not provided for ${address} and no EVMAdapter available. Fingerprinting with limited information.`);
      contractAbi = []; // Ensure contractAbi is an array
    }

    // In a real implementation, this would analyze:
    // 1. Bytecode patterns
    // 2. ABI function signatures
    // 3. Event signatures
    // 4. Storage patterns
    
    // For demo purposes, we'll return a simple fingerprint
    return {
      contractType: this.classifyContract(contractAbi),
      hasRewards: Math.random() > 0.5,
      hasGovernance: Math.random() > 0.7,
      hasStaking: Math.random() > 0.6,
      hasAMM: Math.random() > 0.6,
      riskScore: Math.random()
    };
  }

  private classifyContract(abi: any[]): string { // Explicitly type abi as any[]
    // Simple contract classification based on ABI
    if (!abi || !Array.isArray(abi)) return 'Unknown';
    
    const functionNames = abi
      .filter(item => item.type === 'function')
      .map(item => item.name);
    
    const eventNames = abi
      .filter(item => item.type === 'event')
      .map(item => item.name);

    // Check for common patterns
    if (functionNames.includes('swap') && functionNames.includes('addLiquidity') && functionNames.includes('removeLiquidity')) {
      return 'AMM';
    }
    
    if (functionNames.includes('stake') && functionNames.includes('unstake') && functionNames.includes('claimRewards')) {
      return 'Staking';
    }
    
    if (functionNames.includes('propose') && functionNames.includes('vote') && functionNames.includes('execute')) {
      return 'Governance';
    }
    
    if (functionNames.includes('bridge') && functionNames.includes('deposit') && functionNames.includes('withdraw')) {
      return 'Bridge';
    }

    if (eventNames.includes('Transfer') && eventNames.includes('Approval')) {
      return 'ERC20';
    }

    if (eventNames.includes('Transfer') && eventNames.includes('ApprovalForAll')) {
      return 'ERC721/ERC1155';
    }
    
    return 'Generic';
  }
}