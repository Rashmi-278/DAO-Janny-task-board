
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { contractService } from '@/lib/contractService';

export interface UseContractRolesReturn {
  hasRole: (role: string) => boolean;
  isLoading: boolean;
  error: string | null;
  adminRole: string | null;
  refetch: () => Promise<void>;
}

export const useContractRoles = (roles: string[] = []): UseContractRolesReturn => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [roleStatus, setRoleStatus] = useState<Record<string, boolean>>({});
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    if (!address || !chainId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch admin role constant
      const adminRoleConstant = await contractService.getAdminRole(chainId);
      setAdminRole(adminRoleConstant);

      // Check each role
      const roleChecks = await Promise.all(
        roles.map(async (role) => {
          const hasRole = await contractService.hasRole(role, address, chainId);
          return { role, hasRole };
        })
      );

      const newRoleStatus: Record<string, boolean> = {};
      roleChecks.forEach(({ role, hasRole }) => {
        newRoleStatus[role] = hasRole;
      });

      setRoleStatus(newRoleStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
      console.error('Error fetching contract roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [address, chainId, roles.join(',')]);

  const hasRole = (role: string): boolean => {
    return roleStatus[role] || false;
  };

  return {
    hasRole,
    isLoading,
    error,
    adminRole,
    refetch: fetchRoles
  };
};
