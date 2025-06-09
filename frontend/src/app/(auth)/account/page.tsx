// frontend/src/app/(authenticated)/account/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // ★ user, logout, isProducer を取得
import { updateUserMe } from '@/services/authApi'; // ★ 更新 API 関数
import { User } from '@/types/user'; // ★ User 型
import WithAuth from '@/components/auth/WithAuth';
import {
  Container, Typography, Box, Paper, TextField, Button, CircularProgress, Alert, Stack, Divider,
  Link as MuiLink, Grid, SelectChangeEvent, FormControl, InputLabel, Select, MenuItem,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { AxiosError } from 'axios';
import { getMyProfile, updateMyProfile } from '@/services/profileApi';
import { Profile } from '@/types/profile';
import { PREFECTURES } from '@/constants/addressData';
import { useRouter } from 'next/navigation';

interface AccountFormData {
  first_name: string;
  last_name: string;
  last_name_kana: string;
  first_name_kana: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address1: string;
  address2: string;
  phone_number_user: string;
}

const initialFormData: AccountFormData = {
  first_name: '', last_name: '', last_name_kana: '', first_name_kana: '',
  postal_code: '', prefecture: '', city: '', address1: '', address2: '', phone_number_user: '',
};

function AccountPageContent() {
  const { user, logout, isProducer, isLoading: authLoading, initializeAuth, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // router を取得

 // 初期データ取得 (User と Profile)
  useEffect(() => {
    let isMounted = true; // アンマウント後の state 更新を防ぐ

    if (!authLoading) { // 認証情報のロードが終わってから
      if (isAuthenticated && user) { // 認証済みでユーザー情報がある
        setIsLoading(true); // Profile 取得開始
          console.log('[AccountPage] Auth loaded, fetching profile for user:', user.username);
          getMyProfile()
            .then(profileData => {
              if (!isMounted) return;
              if (profileData) {
                console.log('[AccountPage] Profile data fetched:', profileData);
                setProfile(profileData);
                // setFormData でフォームの初期値を設定
                setFormData({
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  last_name_kana: profileData.last_name_kana || '',
                  first_name_kana: profileData.first_name_kana || '',
                  postal_code: profileData.postal_code || '',
                  prefecture: profileData.prefecture || '',
                  city: profileData.city || '',
                  address1: profileData.address1 || '',
                  address2: profileData.address2 || '',
                  phone_number_user: profileData.phone_number_user || '',
                });
              } else {
                console.warn('[AccountPage] No profile data returned from API.');
                // プロフィールがない場合でも user の氏名はセットしておく
                setFormData(prev => ({
                  ...prev, // 既存の formData を一部維持する場合
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                }));
              }
            })
            .catch(err => {
              if (!isMounted) return;
              console.error("Failed to fetch profile for account page", err);
              setErrors(prev => ({ ...prev, profile: ['プロフィール情報の読み込みに失敗しました。'] }));
              // user の氏名はセットしておく
              setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
              }));
            })
            .finally(() => {
              if (isMounted) setIsLoading(false); // Profile 取得完了
            });
      } else if (!isAuthenticated) { // 未認証の場合
        console.log('[AccountPage] Not authenticated, redirecting to login.');
        router.push('/login');
      } else { // 認証済みだが user が null (通常はありえない)
        setIsLoading(false); // ローディング終了
      }
    }
    return () => { isMounted = false; };
  }, [user, authLoading, isAuthenticated, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const target = e.target as HTMLInputElement; // Selectもこの形で取得可能
    const name = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setSubmitSuccess(false);
    setErrors({});
    if (!isEditing && user && profile) { // 編集開始時に現在の値でフォームをリセット
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        last_name_kana: profile.last_name_kana || '',
        first_name_kana: profile.first_name_kana || '',
        postal_code: profile.postal_code || '',
        prefecture: profile.prefecture || '',
        city: profile.city || '',
        address1: profile.address1 || '',
        address2: profile.address2 || '',
        phone_number_user: profile.phone_number_user || '',
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    try {
      // 1. User モデルの氏名更新
      await updateUserMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      // 2. Profile モデルの更新 (FormData を使うがファイルなし)
      const profileUpdateData = new FormData();
      profileUpdateData.append('last_name_kana', formData.last_name_kana);
      profileUpdateData.append('first_name_kana', formData.first_name_kana);
      profileUpdateData.append('postal_code', formData.postal_code);
      profileUpdateData.append('prefecture', formData.prefecture);
      profileUpdateData.append('city', formData.city);
      profileUpdateData.append('address1', formData.address1);
      profileUpdateData.append('address2', formData.address2);
      profileUpdateData.append('phone_number_user', formData.phone_number_user);
      // is_producer や他の生産者情報はここでは送らない

      await updateMyProfile(profileUpdateData);

      await initializeAuth(); // ★ user と profile 情報を再取得して Jotai ストアを更新
      setSubmitSuccess(true);
      setIsEditing(false);
      alert('アカウント情報が更新されました。');

    } catch (error) {
      console.error("Failed to update account info", error);
      if (error instanceof AxiosError && error.response?.data) {
        const resData = error.response.data as any;
        let combinedErrors: Record<string, any> = {};
        if (typeof resData === 'object' && resData !== null) {
          // resData が UserUpdate のエラーか ProfileUpdate のエラーか区別できないのでマージ
          combinedErrors = { ...resData };
          if (resData.detail) combinedErrors.form = [String(resData.detail)];
          else if (resData.non_field_errors) combinedErrors.form = resData.non_field_errors;
        } else if (typeof resData === 'string') {
          combinedErrors.form = [resData];
        } else {
          combinedErrors.form = ['更新中に予期せぬエラーが発生しました。'];
        }
        setErrors(combinedErrors);
      } else if (error instanceof Error) {
        setErrors({ form: [error.message] });
      } else {
        setErrors({ form: ['更新中に予期せぬエラーが発生しました。'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★ authLoading または isLoading (Profile取得中) ならローディング表示
  if (authLoading || isLoading || !user) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            マイページ
          </Typography>
          {!isEditing && (
            <Button onClick={handleEditToggle} startIcon={<EditIcon />} variant="outlined" size="small">
              基本情報を編集
            </Button>
          )}
        </Stack>

        {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>アカウント情報を更新しました。</Alert>}
        {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{Array.isArray(errors.form) ? errors.form.join(' ') : errors.form}</Alert>}


        <Box component={isEditing ? "form" : "div"} onSubmit={isEditing ? handleSubmit : undefined} noValidate>
          <Grid container direction="column" spacing={3}>
            {/* アカウント情報表示・編集 */}
            <Grid sx={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>アカウント情報</Typography>
              <TextField
                label="ユーザー名"
                value={user.username}
                fullWidth margin="normal"
                InputProps={{
                  readOnly: true,
                  startAdornment:
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                }}
                variant="filled"
                size="small"
              />
              <TextField
                label="メールアドレス"
                value={user.email}
                fullWidth margin="normal"
                InputProps={{
                  readOnly: true,
                  startAdornment:
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                }}
                variant="filled" size="small"
              />
              {isEditing ? (
                <>
                  <Stack flexDirection={{ xs: 'column', sm: 'row'}} gap={{ sm: 2 }}>
                    <Stack flexGrow={1} sx={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="姓"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        size="small"
                        disabled={isSubmitting}
                        error={!!errors.last_name}
                        helperText={errors.last_name ? String(errors.last_name) : ''}
                        inputProps={{ maxLength: 15 }}
                      />
                    </Stack>
                    <Stack flexGrow={1} sx={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="名"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        size="small"
                        disabled={isSubmitting} error={!!errors.first_name}
                        helperText={errors.first_name ?
                        String(errors.first_name) : ''}
                      />
                    </Stack>
                  </Stack>
                  <Stack flexDirection={{ xs: 'column', sm: 'row'}} gap={{ sm: 2 }}>
                    <Stack flexGrow={1} sx={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="姓 (カナ)"
                        name="last_name_kana"
                        value={formData.last_name_kana}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        size="small"
                        disabled={isSubmitting}
                        error={!!errors.last_name_kana}
                        helperText={errors.last_name_kana ? String(errors.last_name_kana) : ''}
                      />
                    </Stack>
                    <Stack flexGrow={1} sx={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="名 (カナ)"
                        name="first_name_kana"
                        value={formData.first_name_kana}
                        onChange={handleChange}
                        fullWidth margin="normal"
                        size="small" disabled={isSubmitting}
                        error={!!errors.first_name_kana}
                        helperText={errors.first_name_kana ? String(errors.first_name_kana) : ''}
                      />
                    </Stack>
                  </Stack>

                  <Stack flexDirection={{ xs: 'column', md: 'row' }} gap={{ sm: 2 }}>
                    <Stack flexGrow={1} sx={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="郵便番号"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        margin="normal"
                        size="small"
                        disabled={isSubmitting}
                        error={!!errors.postal_code}
                        helperText={errors.postal_code ? String(errors.postal_code) : ''} placeholder="例: 1234567 or 123-4567"
                      />
                    </Stack>
                    <Stack flexGrow={3} sx={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small" margin="normal" error={!!errors.prefecture}>
                        <InputLabel id="prefecture-label">都道府県</InputLabel>
                        <Select
                          labelId="prefecture-label"
                          name="prefecture"
                          value={formData.prefecture}
                          label="都道府県"
                          onChange={handleChange}
                          disabled={isSubmitting}
                        >
                          <MenuItem value=""><em>選択</em></MenuItem>
                          {PREFECTURES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                        {errors.prefecture && <Typography color="error" variant="caption">{String(errors.prefecture)}</Typography>}
                      </FormControl>
                    </Stack>
                    <Stack flexGrow={2} sx={{ xs: 12, sm: 4 }}>
                      <TextField label="市区町村" name="city" value={formData.city} onChange={handleChange} fullWidth margin="normal" size="small" disabled={isSubmitting} error={!!errors.city} helperText={errors.city ? String(errors.city) : ''} />
                    </Stack>
                  </Stack>
                  <Grid sx={{ xs: 12 }}>
                    <TextField label="番地など" name="address1" value={formData.address1} onChange={handleChange} fullWidth margin="normal" size="small" disabled={isSubmitting} error={!!errors.address1} helperText={errors.address1 ? String(errors.address1) : ''} />
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField label="建物名・部屋番号 (任意)" name="address2" value={formData.address2} onChange={handleChange} fullWidth margin="normal" size="small" disabled={isSubmitting} error={!!errors.address2} helperText={errors.address2 ? String(errors.address2) : ''} />
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField label="電話番号" name="phone_number_user" type="tel" value={formData.phone_number_user} onChange={handleChange} fullWidth margin="normal" size="small" disabled={isSubmitting} error={!!errors.phone_number_user} helperText={errors.phone_number_user ? String(errors.phone_number_user) : ''} />
                  </Grid>
                </>
              ) : (
                <>
                  {/* 表示モード */}
                  <TextField label="氏名" value={`${user.last_name || ''} ${user.first_name || ''}`.trim() || '(未設定)'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" size="small" />
                  <TextField label="フリガナ" value={`${profile?.last_name_kana || ''} ${profile?.first_name_kana || ''}`.trim() || '(未設定)'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" size="small" />
                  <TextField label="郵便番号" value={profile?.postal_code || '(未設定)'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" size="small" />
                  <TextField label="住所" value={`${profile?.prefecture || ''}${profile?.city || ''}${profile?.address1 || ''} ${profile?.address2 || ''}`.trim() || '(未設定)'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" size="small" multiline />
                  <TextField label="電話番号" value={profile?.phone_number_user || '(未設定)'} fullWidth margin="normal" InputProps={{ readOnly: true }} variant="filled" size="small" />
                </>
              )}
            </Grid>

            {isEditing && (
              <Grid sx={{ xs: 12, display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={handleEditToggle} disabled={isSubmitting} variant="outlined" color="secondary" startIcon={<CancelIcon />}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="contained" startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}>
                  保存する
                </Button>
              </Grid>
            )}
            <Grid  sx={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* 生産者向けリンク */}
            {isProducer && (
              <Grid sx={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>生産者メニュー</Typography>
                <Stack spacing={1} direction="row" flexWrap="wrap">
                  <Button component={Link} href="/my-products" variant="outlined">商品管理</Button>
                  <Button component={Link} href="/my-products/new" variant="outlined">商品登録</Button>
                  <Button component={Link} href="/farm-settings" variant="outlined">生産者情報編集</Button>
                  <Button component={Link} href="/orders-received" variant="outlined">受注管理</Button>
                  {/* 他の生産者向けリンク */}
                </Stack>
              </Grid>
            )}

            <Grid sx={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* 実需者向けリンク (共通) */}
            <Grid sx={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>マイアクティビティ</Typography>
                <Stack spacing={1} direction="row" flexWrap="wrap">
                  <Button component={Link} href="/my-orders" variant="outlined">注文履歴</Button>
                  <Button component={Link} href="/favorites" variant="outlined">お気に入り</Button>
                  {/* 他のリンク */}
              </Stack>
            </Grid>

            <Grid sx={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* ログアウトボタン */}
            <Grid sx={{ xs: 12, textAlign: 'center', mt: 3 }}>
              <Button variant="contained" color="error" onClick={logout} size="large">
                ログアウト
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default function Account() {
  return (
    <WithAuth>
      <AccountPageContent />
    </WithAuth>
  );
}