// frontend/src/app/(auth)/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Container, Box, Typography, TextField, Button, Grid, CircularProgress, Alert, Paper
} from '@mui/material';
import MuiLink from '@mui/material/Link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('[LoginPage] Attempting login with:', { username, password }); // ★ state 確認ログ
    try {
      await login({ username, password }); // state の値を渡す

      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login attempt failed');
      // エラー表示は error state 経由で行う
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectPath = searchParams.get('redirect');
      router.push(redirectPath || '/');
    }
  }, [isAuthenticated, isLoading, router, searchParams]);


  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          ログイン
        </Typography>

        {error && !isLoading && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {/* ユーザー名 TextField */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ユーザー名"
            name="username" // name 属性も重要
            autoComplete="username"
            autoFocus
            value={username} // ★ value プロパティを設定
            onChange={(e) => setUsername(e.target.value)} // ★ onChange で state を更新
            disabled={isLoading}
            error={!!error} // ★ エラーがあればエラー表示 (より詳細なフィールド別エラーも可)
            // helperText={/* 必要ならエラーメッセージ */}
          />
          {/* パスワード TextField */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password" // name 属性も重要
            label="パスワード"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password} // ★ value プロパティを設定
            onChange={(e) => setPassword(e.target.value)} // ★ onChange で state を更新
            disabled={isLoading}
            error={!!error} // ★ エラーがあればエラー表示
            // helperText={/* 必要ならエラーメッセージ */}
          />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, p: 1.2, fontSize: '1.2rem' }} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'ログイン'}
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid>
              <MuiLink component={NextLink} href="/register" variant="body2" underline="hover">
                アカウントをお持ちでないですか？ 新規登録
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}