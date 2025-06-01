
import { keccak256, toBytes } from 'viem';

// Role constants matching the smart contract
export const CONTRACT_ROLES = {
  ADMIN_ROLE: keccak256(toBytes("ADMIN_ROLE")),
  GOVERNANCE_ROLE: keccak256(toBytes("GOVERNANCE_ROLE")),
  TREASURY_ROLE: keccak256(toBytes("TREASURY_ROLE")),
  TECHNICAL_ROLE: keccak256(toBytes("TECHNICAL_ROLE")),
  COMMUNITY_ROLE: keccak256(toBytes("COMMUNITY_ROLE")),
  GRANTS_ROLE: keccak256(toBytes("GRANTS_ROLE")),
  OPERATIONS_ROLE: keccak256(toBytes("OPERATIONS_ROLE"))
} as const;

// Map UI roles to contract roles
export const ROLE_MAPPING = {
  'governance': CONTRACT_ROLES.GOVERNANCE_ROLE,
  'treasury': CONTRACT_ROLES.TREASURY_ROLE,
  'technical': CONTRACT_ROLES.TECHNICAL_ROLE,
  'community': CONTRACT_ROLES.COMMUNITY_ROLE,
  'grants': CONTRACT_ROLES.GRANTS_ROLE,
  'operations': CONTRACT_ROLES.OPERATIONS_ROLE
} as const;

// Domain mapping for task types - fix TypeScript issue with array types
export const DOMAIN_MAPPING = {
  'governance': ['governance', 'strategy', 'unassigned'] as const,
  'treasury': ['accounting', 'business_development', 'strategy', 'unassigned'] as const,
  'technical': ['tech', 'contracts', 'unassigned'] as const,
  'community': ['business_development', 'strategy', 'unassigned'] as const,
  'grants': ['accounting', 'business_development', 'strategy', 'unassigned'] as const,
  'operations': ['business_development', 'strategy', 'unassigned'] as const
} as const;
