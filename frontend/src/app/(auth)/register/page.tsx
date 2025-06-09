// frontend/src/app/(auth)/register/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/services/authApi'; // ★ register API 関数をインポート
import { RegisterPayload } from '@/types/auth'; // ★ 型をインポート
import { AxiosError } from 'axios';
import {
  Container, Box, Typography, TextField, Button, Grid, CircularProgress, Alert, Stack,
  Paper
} from '@mui/material';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterPayload>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '', // オプションなので初期値は空
    last_name: '',  // オプションなので初期値は空
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ★ エラー state はフィールドごとのエラーを保持できるようにする
  const [errors, setErrors] = useState<Record<string, string[] | string>>({});
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false); // 登録成功メッセージ用

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 入力時にエラーをクリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
     // password が変更されたら password2 のエラーもクリア (任意)
    if (name === 'password' && errors.password2) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password2; // ★ password2 キーを削除
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    // フロントエンドでの簡単なパスワード一致チェック (任意だが推奨)
    if (formData.password !== formData.password2) {
      setErrors({ password2: ['パスワードが一致しません。'] });
      setIsSubmitting(false);
      return;
    }

    try {
      const registeredUser = await register(formData);
      setSubmitSuccess(true);
      setErrors({});
      alert(`登録が完了しました！ようこそ、${registeredUser.username} さん。ログインページに移動します。`);
      router.push('/login'); // 登録後はログインページへ遷移

    } catch (error) {
      console.error('Registration failed:', error);
      setSubmitSuccess(false); // 先に success を false に

      if (error instanceof AxiosError && error.response) { // ★ error.response の存在をチェック
         console.error('Axios error response:', error.response.data); // レスポンス内容をログ出力
         const responseData = error.response.data;

         if (responseData && typeof responseData === 'object') {
            // バックエンドからのバリデーションエラーをセット
            setErrors(responseData as Record<string, string[]>);

            // non_field_errors や detail もチェックしてセット
            if (responseData.non_field_errors) {
                 setErrors(prev => ({...prev, form: responseData.non_field_errors}));
            } else if (responseData.detail && typeof responseData.detail === 'string') { // detail が文字列か確認
                 setErrors(prev => ({...prev, form: [responseData.detail]}));
            } else if (responseData.detail && Array.isArray(responseData.detail)) { // detail が配列の場合
                 setErrors(prev => ({...prev, form: responseData.detail}));
            }
            // alert('入力内容にエラーがあります。'); // Alert で表示するので不要かも
         } else {
            // レスポンスはあるが、予期しない形式の場合
             setErrors({ form: [`サーバーエラーが発生しました(Code: ${error.response.status})`] });
         }

      } else if (error instanceof Error) {
          // ネットワークエラーなど、レスポンスがない AxiosError もここに含まれる可能性がある
          setErrors({ form: [error.message || 'ネットワークエラーが発生しました。'] });
      } else {
          // その他の予期せぬエラー
          setErrors({ form: ['登録中に予期せぬエラーが発生しました。'] });
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}> {/* xs で幅を狭く */}
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          新規ユーザー登録
        </Typography>

        {/* フォーム全体のエラー表示 */}
        {errors.form && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {Array.isArray(errors.form) ? errors.form.join(', ') : errors.form}
            </Alert>
        )}
        {/* 登録成功メッセージ */}
        {submitSuccess && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>登録リクエストを送信しました。</Alert>}


        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ユーザー名"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={Array.isArray(errors.username) ? errors.username.join(', ') : errors.username}
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={Array.isArray(errors.email) ? errors.email.join(', ') : errors.email}
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password || !!errors.password2} // password2のエラーもここで表示
            helperText={
                (Array.isArray(errors.password) ? errors.password.join(', ') : errors.password) ||
                (Array.isArray(errors.password2) ? errors.password2.join(', ') : errors.password2) // password2 のエラーも表示
            }
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password2"
            label="パスワード (確認用)"
            type="password"
            id="password2"
            autoComplete="new-password"
            value={formData.password2}
            onChange={handleChange}
            error={!!errors.password2} // password2 のエラーのみ表示
            // helperText は password 側で表示するので不要
            disabled={isSubmitting}
          />
          {/* オプションのフィールド */}
          <TextField
            margin="normal"
            fullWidth
            id="first_name"
            label="名 (任意)"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={Array.isArray(errors.first_name) ? errors.first_name.join(', ') : errors.first_name}
            disabled={isSubmitting}
          />
          <TextField
            margin="normal"
            fullWidth
            id="last_name"
            label="姓 (任意)"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={!!errors.last_name}
            helperText={Array.isArray(errors.last_name) ? errors.last_name.join(', ') : errors.last_name}
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : '登録する'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  すでにアカウントをお持ちですか？ ログイン
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}