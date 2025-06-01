
import type { Member } from '@/lib/memberService';
import { DOMAIN_MAPPING } from './constants';

export class MemberFilterService {
  filterMembersByDomain(members: Member[], taskType: string): Member[] {
    const allowedDomains = DOMAIN_MAPPING[taskType as keyof typeof DOMAIN_MAPPING];
    
    if (!allowedDomains) {
      console.warn(`Unknown task type ${taskType}, using all available members`);
      return members;
    }
    
    const filteredMembers = members.filter(member => 
      member.domain && allowedDomains.includes(member.domain as any)
    );
    
    // If no members match the domain criteria, fall back to all members
    if (filteredMembers.length === 0) {
      console.warn(`No members found for domain ${taskType}, using all available members`);
      return members;
    }
    
    console.log(`Filtered ${filteredMembers.length} members for ${taskType} domain:`, filteredMembers.map(m => m.domain));
    return filteredMembers;
  }
}
