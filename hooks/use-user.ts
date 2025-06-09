'use client';

import { trpc } from '@/trpc/client';
import { useSession } from 'next-auth/react';

export function useUser() {
  const { status } = useSession();
  const { data: user, isLoading } = trpc.auth.getOne.useQuery(undefined, {
    enabled: status === 'authenticated',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: status === 'authenticated' ? user : null,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: status === 'authenticated',
  };
}