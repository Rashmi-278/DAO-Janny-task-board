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
  governance: ['governance', 'constitution', 'voting', 'delegate', 'parameters', 'rules', 'policy', 'amendment', 'bylaws', 'charter'],
  treasury: ['treasury', 'funding', 'budget', 'financial', 'allocation', 'spend', 'payment', 'grant', 'investment', 'funds'],
  technical: ['technical', 'upgrade', 'protocol', 'smart contract', 'implementation', 'development', 'code', 'infrastructure', 'security'],
  community: ['community', 'event', 'marketing', 'outreach', 'education', 'communication', 'partnership', 'collaboration'],
  grants: ['grant', 'funding', 'support', 'research', 'ecosystem', 'builder', 'developer', 'bounty'],
  operations: ['operations', 'administrative', 'management', 'process', 'workflow', 'coordination', 'execution']
};

function categorizeProposal(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Score each category based on keyword matches
  const categoryScores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    categoryScores[category] = keywords.filter(keyword => text.includes(keyword)).length;
  }
  
  // Find the category with the highest score
  const bestCategory = Object.entries(categoryScores).reduce((best, current) => 
    current[1] > best[1] ? current : best
  )[0];
  
  // Return the best match or default to operations
  return categoryScores[bestCategory] > 0 ? bestCategory : 'operations';
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
    } else if (data.proposals && data.proposals.offchain && Array.isArray(data.proposals.offchain)) {
      proposals = data.proposals.offchain;
    } else if (Array.isArray(data)) {
      proposals = data;
    }
    
    // Filter and transform proposals - ONLY include closed proposals
    const filteredProposals = proposals
      .filter((proposal: any) => {
        const status = proposal.status?.toLowerCase() || proposal.state?.toLowerCase() || '';
        return status === 'closed'; // Only include closed proposals
      })
      .map((proposal: any, index: number): Proposal => {
        const title = proposal.title || proposal.name || `Proposal ${index + 1}`;
        const description = proposal.description || proposal.summary || proposal.body || '';
        
        return {
          id: proposal.id || proposal.proposal_id || `${daoId}-${index}`,
          title,
          description: description.slice(0, 200) + (description.length > 200 ? '...' : ''),
          status: 'closed', // All filtered proposals are closed
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
    
    console.log(`Processed ${filteredProposals.length} closed proposals for ${daoId}:`, filteredProposals);
    
    return filteredProposals;
    
  } catch (error) {
    console.error(`Failed to fetch proposals for ${daoId}:`, error);
    return [];
  }
}
