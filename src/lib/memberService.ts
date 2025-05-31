
export interface Member {
  id: string;
  name?: string;
  address: string;
  delegatedVotes?: number;
  votingWeight?: number;
  proposalsCreated?: number;
  role?: 'reviewer' | 'executor' | 'analyst' | 'coordinator' | 'unassigned';
  onchainRole?: string;
  type?: string;
}

async function fetchAllMembersWithPagination(baseUrl: string, daoId: string): Promise<any[]> {
  let allMembers: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = cursor ? `${baseUrl}&cursor=${cursor}` : baseUrl;
      console.log(`Fetching members from: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.Members?.members) {
        // For ENS, prioritize onchain members
        if (daoId === 'ens' && data.Members.members.onchain?.members) {
          allMembers = allMembers.concat(data.Members.members.onchain.members);
          cursor = data.Members.members.onchain.onchain_cursor_str;
        }
        // Add offchain members if available
        else if (data.Members.members.offchain?.members) {
          allMembers = allMembers.concat(data.Members.members.offchain.members);
          cursor = data.Members.members.offchain.offchain_cursor_str;
        }
        // For 1inch, use whatever structure is available
        else if (data.Members.members.members) {
          allMembers = allMembers.concat(data.Members.members.members);
          cursor = null; // No cursor info available for this structure
          hasMore = false;
        }
      }
      
      // Check if we should continue pagination
      if (!cursor || allMembers.length >= 100) { // Limit to 100 members for performance
        hasMore = false;
      }
      
    } catch (error) {
      console.error('Error fetching members page:', error);
      hasMore = false;
    }
  }
  
  return allMembers;
}

export async function fetchDAOMembers(daoId: string): Promise<Member[]> {
  try {
    let apiUrl = '';
    
    if (daoId === '1inch') {
      apiUrl = 'https://membersuri.daostar.org/members/1inch.eth';
    } else if (daoId === 'ens') {
      apiUrl = 'https://membersuri.daostar.org/members/ens.eth?onchain=ens';
    } else {
      return [];
    }

    console.log(`Fetching all members for ${daoId}`);
    
    const allMembers = await fetchAllMembersWithPagination(apiUrl, daoId);
    
    console.log(`Found ${allMembers.length} total members for ${daoId}`);
    
    // Transform members data
    const processedMembers = allMembers
      .map((member: any, index: number): Member => {
        const address = member.id || member.address || `0x${index.toString().padStart(40, '0')}`;
        return {
          id: address,
          name: member.name || member.ens || `Member ${index + 1}`,
          address: address,
          delegatedVotes: member.delegatedVotes || member.voting_weight || Math.floor(Math.random() * 1000),
          votingWeight: member.votingWeight || member.delegated_votes || Math.floor(Math.random() * 100),
          proposalsCreated: member.proposalsCreated || Math.floor(Math.random() * 10),
          role: 'unassigned',
          onchainRole: member.role || undefined,
          type: member.type || 'EthereumAddress'
        };
      });
    
    console.log(`Processed ${processedMembers.length} members for ${daoId}:`, processedMembers.slice(0, 5));
    
    return processedMembers;
    
  } catch (error) {
    console.error(`Failed to fetch members for ${daoId}:`, error);
    return [];
  }
}
