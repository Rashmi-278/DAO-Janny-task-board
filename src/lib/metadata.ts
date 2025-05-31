import lighthouse from '@lighthouse-web3/sdk';

interface TaskMetadata {
  action: 'delegate_opt_in' | 'random_assignment' | 'task_creation' | 'task_completion' | 'proposal_categorization' | 'categorization_complete';
  taskId: string;
  timestamp: string;
  delegateAddress?: string;
  assignedDelegate?: string;
  taskDetails: any;
  randomnessSource?: string;
  blockNumber?: number;
  transactionHash?: string;
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
    // Note: In production, the API key should be stored securely
    // For now, using a placeholder - users would need to provide their own API key
    const apiKey = process.env.REACT_PUBLIC_LH_API_KEY; // This should be replaced with actual API key
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
