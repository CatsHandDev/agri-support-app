'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress, Alert } from '@mui/material';

interface WithProducerAuthProps {
  children: React.ReactNode;
}

export default function WithProducerAuth({ children }: WithProducerAuthProps) {
  const { isAuthenticated, isLoading, isProducer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ローディングが完了していて、かつ (認証されていない または 生産者でない) 場合
    if (!isLoading && (!isAuthenticated || !isProducer)) {
      console.log('[withProducerAuth] Auth check failed, redirecting...');
      // ログインページにリダイレクト (必要なら復帰先も指定)
      // const currentPath = window.location.pathname + window.location.search;
      // router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      router.push('/'); // またはトップページへ
    }
  }, [isAuthenticated, isLoading, isProducer, router]);

  // ローディング中はスピナー表示
  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // 認証済み かつ 生産者の場合は、子要素 (ラップされたページコンポーネント) を表示
  if (isAuthenticated && isProducer) {
    return <>{children}</>; // React.Fragment (<> </>) でラップ
  }

  // 上記以外 (リダイレクト待ちなど) は一時的なメッセージ表示
  // (null を返すと一瞬何も表示されないことがあるため)
  return (
      <Container sx={{ mt: 4 }}>
          <Alert severity="warning">アクセス権を確認中、またはアクセス権がありません...</Alert>
      </Container>
  );
}