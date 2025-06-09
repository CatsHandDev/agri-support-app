'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress, Alert } from '@mui/material';

export default function WithAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[WithAuth] Not authenticated, redirecting to login...');
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`); // ★ 復帰先を指定
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <Container sx={{ /*...*/ }}><CircularProgress /></Container>;
  }
  if (isAuthenticated) {
    return <>{children}</>;
  }
  return <Container sx={{ mt: 4 }}><Alert severity="warning">ログインが必要です...</Alert></Container>;
}