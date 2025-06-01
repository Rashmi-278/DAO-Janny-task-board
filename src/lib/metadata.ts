
import lighthouse from '@lighthouse-web3/sdk';
import { REACT_PUBLIC_LH_API_KEY } from './Web3Provider';

interface TaskMetadata {
  action: 'delegate_opt_in' | 'random_assignment' | 'task_creation' | 'task_completion' | 'proposal_categorization' | 'categorization_complete' | 'task_update' | 'delegate_assignment' | 'smart_contract_assignment' | 'fallback_assignment';
  taskId: string;
  timestamp: string;
  delegateAddress?: string;
  assignedDelegate?: string;
  taskDetails: any;
  randomnessSource?: string;
  blockNumber?: number;
  transactionHash?: string;
  eligibleMembers?: string[];
  chainId?: number;
  error?: string;
}

export const generateTaskMetadata = (data: TaskMetadata): TaskMetadata => {
  const metadata: TaskMetadata = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
    blockNumber: Math.floor(Math.random() * 1000000), // Would be actual block number
  };

  console.log('Generated metadata:', JSON.stringify(metadata, null, 2));
  return metadata;
};

export const saveToLighthouse = async (metadata: TaskMetadata): Promise<string> => {
  try {
    const apiKey = REACT_PUBLIC_LH_API_KEY;
    const name = `dao-janny-${metadata.action}-${metadata.taskId}`;
    
    console.log('Saving to Lighthouse...');
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
    
    // Convert metadata to text for Lighthouse upload
    const metadataText = JSON.stringify(metadata, null, 2);
    
    const response = await lighthouse.uploadText(metadataText, apiKey, name);
    
    console.log(`Metadata saved to Lighthouse with Hash: ${response.data.Hash}`);
    console.log('Full response:', response);
    
    // Store locally for demonstration (keeping existing functionality)
    const storedMetadata = JSON.parse(localStorage.getItem('lighthouse_metadata') || '[]');
    storedMetadata.push({ 
      hash: response.data.Hash, 
      name: response.data.Name,
      size: response.data.Size,
      metadata, 
      savedAt: new Date().toISOString() 
    });
    localStorage.setItem('lighthouse_metadata', JSON.stringify(storedMetadata));
    
    return response.data.Hash;
  } catch (error) {
    console.error('Failed to save metadata to Lighthouse:', error);
    throw error;
  }
};

export const getLighthouseMetadata = (): Array<{ hash: string; name: string; size: string; metadata: TaskMetadata; savedAt: string }> => {
  try {
    return JSON.parse(localStorage.getItem('lighthouse_metadata') || '[]');
  } catch {
    return [];
  }
};

// Legacy function name for backward compatibility
export const saveToFilecoin = saveToLighthouse;
export const getFilecoinMetadata = getLighthouseMetadata;
