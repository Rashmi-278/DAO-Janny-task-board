
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
    
    // Process the response based on the API structure
    let members = [];
    
    if (data.members && Array.isArray(data.members)) {
      members = data.members;
    } else if (Array.isArray(data)) {
      members = data;
    }
    
    // Transform members data
    const processedMembers = members
      .slice(0, 20) // Limit to first 20 members for UI performance
      .map((member: any, index: number): Member => {
        return {
          id: member.id || member.address || `member-${index}`,
          name: member.name || member.ens || `Member ${index + 1}`,
          address: member.address || member.id || '',
          delegatedVotes: member.delegatedVotes || member.voting_weight || 0,
          votingWeight: member.votingWeight || member.delegated_votes || 0,
          proposalsCreated: member.proposalsCreated || 0,
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
