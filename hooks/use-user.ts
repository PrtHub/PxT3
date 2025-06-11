'use client';

import { trpc } from '@/trpc/client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import useAuthStore from '@/modules/auth/store/auth-store';

export function useUser() {
  const { status } = useSession();
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    setUser, 
    setIsLoading, 
    setIsAuthenticated 
  } = useAuthStore();

  const { data: userData, isLoading: isUserLoading } = trpc.auth.getOne.useQuery(undefined, {
    enabled: status === 'authenticated',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsLoading(status === 'loading');
    setIsAuthenticated(status === 'authenticated');
  }, [status, setIsLoading, setIsAuthenticated]);

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData, setUser]);

  return {
    user: isAuthenticated ? user : null,
    isLoading: isLoading || isUserLoading,
    isAuthenticated,
  };
}