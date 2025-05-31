
export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'onchain' | 'closed' | 'approved';
  category: 'governance' | 'treasury' | 'technical' | 'community' | 'grants' | 'operations';
  author: string;
  created: string;
  deadline?: string;
  votes?: {
    for: number;
    against: number;
    abstain: number;
  };
  url?: string;
}

// DAOIP-4 categorization keywords
const categoryKeywords = {
  governance: ['governance', 'constitution', 'voting', 'delegate', 'parameters', 'rules', 'policy'],
  treasury: ['treasury', 'funding', 'budget', 'financial', 'allocation', 'spend', 'payment'],
  technical: ['technical', 'upgrade', 'protocol', 'smart contract', 'implementation', 'development', 'code'],
  community: ['community', 'event', 'marketing', 'outreach', 'education', 'communication'],
  grants: ['grant', 'funding', 'support', 'research', 'ecosystem', 'builder'],
  operations: ['operations', 'administrative', 'management', 'process', 'workflow']
};

function categorizeProposal(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'operations'; // default category
}

export async function fetchDAOProposals(daoId: string): Promise<Proposal[]> {
  try {
    let apiUrl = '';
    
    if (daoId === '1inch') {
      apiUrl = 'https://proposalsuri.daostar.org/proposals/1inch.eth';
    } else if (daoId === 'ens') {
      apiUrl = 'https://proposalsuri.daostar.org/proposals/ens.eth?onchain=ens';
    } else {
      return [];
    }

    console.log(`Fetching proposals for ${daoId} from: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log(`Raw API response for ${daoId}:`, data);
    
    // Process the response based on the API structure
    let proposals = [];
    
    if (data.proposals && Array.isArray(data.proposals)) {
      proposals = data.proposals;
    } else if (Array.isArray(data)) {
      proposals = data;
    }
    
    // Filter and transform proposals
    const filteredProposals = proposals
      .filter((proposal: any) => {
        const status = proposal.status?.toLowerCase() || proposal.state?.toLowerCase() || '';
        return status === 'closed'; // Only include closed proposals
      })
      .map((proposal: any, index: number): Proposal => {
        const title = proposal.title || proposal.name || `Proposal ${index + 1}`;
        const description = proposal.description || proposal.summary || proposal.body || '';
        const status = proposal.status?.toLowerCase() || proposal.state?.toLowerCase() || 'onchain';
        
        // Map various status values to our expected statuses
        let mappedStatus: 'onchain' | 'closed' | 'approved' = 'onchain'
        if (status === 'closed' || status === 'defeated' || status === 'expired') {
          mappedStatus = 'closed';
        } else if (status === 'approved' || status === 'executed' || status === 'succeeded') {
          mappedStatus = 'approved';
        }
        
        return {
          id: proposal.id || proposal.proposal_id || `${daoId}-${index}`,
          title,
          description: description.slice(0, 200) + (description.length > 200 ? '...' : ''),
          status: mappedStatus,
          category: categorizeProposal(title, description) as any,
          author: proposal.author || proposal.proposer || 'Unknown',
          created: proposal.created || proposal.start_date || new Date().toISOString(),
          deadline: proposal.end_date || proposal.deadline,
          votes: proposal.votes ? {
            for: proposal.votes.for || proposal.votes.yes || 0,
            against: proposal.votes.against || proposal.votes.no || 0,
            abstain: proposal.votes.abstain || 0
          } : undefined,
          url: proposal.url || proposal.discussion_url
        };
      });
    
    console.log(`Processed ${filteredProposals.length} proposals for ${daoId}:`, filteredProposals);
    
    return filteredProposals;
    
  } catch (error) {
    console.error(`Failed to fetch proposals for ${daoId}:`, error);
    return [];
  }
}
