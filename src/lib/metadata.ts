
interface TaskMetadata {
  action: 'delegate_opt_in' | 'random_assignment' | 'task_creation' | 'task_completion';
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

export const saveToFilecoin = async (metadata: TaskMetadata): Promise<string> => {
  try {
    // In a real implementation, this would interact with Filecoin API
    // For now, we'll simulate the save operation
    const cid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    console.log('Saving to Filecoin...');
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Metadata saved to Filecoin with CID: ${cid}`);
    
    // Store locally for demonstration
    const storedMetadata = JSON.parse(localStorage.getItem('filecoin_metadata') || '[]');
    storedMetadata.push({ cid, metadata, savedAt: new Date().toISOString() });
    localStorage.setItem('filecoin_metadata', JSON.stringify(storedMetadata));
    
    return cid;
  } catch (error) {
    console.error('Failed to save metadata to Filecoin:', error);
    throw error;
  }
};

export const getFilecoinMetadata = (): Array<{ cid: string; metadata: TaskMetadata; savedAt: string }> => {
  try {
    return JSON.parse(localStorage.getItem('filecoin_metadata') || '[]');
  } catch {
    return [];
  }
};
