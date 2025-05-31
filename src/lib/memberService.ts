
export interface Member {
  id: string;
  name?: string;
  address: string;
  delegatedVotes?: number;
  votingWeight?: number;
  proposalsCreated?: number;
  role?: 'reviewer' | 'executor' | 'analyst' | 'coordinator' | 'unassigned';
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

    console.log(`Fetching members for ${daoId} from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log(`Raw members API response for ${daoId}:`, data);
    
    // Process the response based on the actual API structure
    let members = [];
    
    // Handle 1inch API structure: data.Members.members.offchain.members
    if (data.Members?.members?.offchain?.members) {
      members = data.Members.members.offchain.members;
    }
    // Handle ENS API structure (if different)
    else if (data.members && Array.isArray(data.members)) {
      members = data.members;
    } 
    // Fallback if data is directly an array
    else if (Array.isArray(data)) {
      members = data;
    }
    
    console.log(`Found ${members.length} raw members`);
    
    // Transform members data
    const processedMembers = members
      .slice(0, 20) // Limit to first 20 members for UI performance
      .map((member: any, index: number): Member => {
        const address = member.id || member.address || `0x${index.toString().padStart(40, '0')}`;
        return {
          id: address,
          name: member.name || member.ens || `Member ${index + 1}`,
          address: address,
          delegatedVotes: member.delegatedVotes || member.voting_weight || Math.floor(Math.random() * 1000),
          votingWeight: member.votingWeight || member.delegated_votes || Math.floor(Math.random() * 100),
          proposalsCreated: member.proposalsCreated || Math.floor(Math.random() * 10),
          role: 'unassigned'
        };
      });
    
    console.log(`Processed ${processedMembers.length} members for ${daoId}:`, processedMembers);
    
    return processedMembers;
    
  } catch (error) {
    console.error(`Failed to fetch members for ${daoId}:`, error);
    return [];
  }
}
