'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMyProfile, updateMyProfile } from '@/services/profileApi';
import { Profile } from '@/types/profile';
import Image from 'next/image';
import styles from './page.module.scss';
import { AxiosError } from 'axios';
import {
  Container, Box, Typography, TextField, Button, Grid, Select, MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, CircularProgress, Alert, IconButton, Avatar, Stack, SelectChangeEvent
} from '@mui/material'; // MUI コンポーネント
import { PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import WithProducerAuth from '@/components/auth/withProducerAuth';

// フォームデータの型
type ProfileFormData = Omit<Partial<Profile>, 'id' | 'username' | 'email' | 'created_at' | 'updated_at' | 'image'>;

const initialFormData: Partial<Profile> = {
  farm_name: '',
  location_prefecture: '',
  location_city: '',
  bio: '',
  website_url: '',
  phone_number: '',
  certification_info: '',
  is_producer: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null); // APIから取得したプロフィール
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData); // フォーム入力用
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // 表示/プレビュー用URL
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | string>>({}); // エラー型を調整
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // 初期データ取得
  useEffect(() => {
    let isMounted = true;
    // HOC で認証済みなので、ここでは isMounted のみ考慮
    setIsLoading(true);
    setSubmitSuccess(false);
    getMyProfile()
      .then(data => {
        if (!isMounted) return;
        setProfile(data); // 元のプロフィールデータを保持
        setFormData({ // フォームデータを初期化
          farm_name: data.farm_name ?? '', location_prefecture: data.location_prefecture ?? '',
          location_city: data.location_city ?? '', bio: data.bio ?? '',
          website_url: data.website_url ?? '', phone_number: data.phone_number ?? '',
          certification_info: data.certification_info ?? '', is_producer: data.is_producer ?? false,
        });
        setCurrentImageUrl(data.image); // 画像URLをセット
        setErrors({});
      })
      .catch(error => {
        if (!isMounted) return;
        console.error('Failed to fetch profile', error);
        setErrors({ detail: 'プロフィールの読み込みに失敗しました。' });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false };
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImageUrl(reader.result as string); // プレビュー用に一時的にURLを更新
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      // ファイル選択がキャンセルされた場合、元の画像URLに戻す
      setCurrentImageUrl(profile?.image ?? null);
    }
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev }; // コピー
        delete newErrors.image;       // 'image' フィールドを削除
        return newErrors;             // 新しいオブジェクトを返す
      });
    }
  };

  // 画像削除ハンドラ
  const handleImageDelete = useCallback(() => {
    console.log('[handleImageDelete] Clearing selected image and preview.');
    setImageFile(null);       // 選択されていたファイル情報をクリア
    setCurrentImageUrl(null); // 画像プレビュー/表示URLをクリア

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
  }, [setErrors]);

  // 送信ハンドラ
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const updateFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
       // null や undefined でない値のみ追加 (PATCHのため)
       // boolean はそのまま追加 (Django側で解釈)
      if (value !== null && value !== undefined) {
        if (typeof value === 'boolean') {
          updateFormData.append(key, value ? 'true' : 'false');
        } else {
          // boolean 以外はすべて文字列に変換して append
          updateFormData.append(key, String(value));
        }
      }
    });

    // 新しい画像ファイルが選択されていれば追加
    if (imageFile) {
      updateFormData.append('image', imageFile, imageFile.name);
    } else if (currentImageUrl === null && profile?.image) {
      updateFormData.append('image', '');
      console.log('[handleSubmit] Appending empty string to clear image.');
    }

    try {
      const updatedProfile = await updateMyProfile(updateFormData);
      setProfile(updatedProfile);
      setFormData({
        farm_name: updatedProfile.farm_name ?? '',
        location_prefecture: updatedProfile.location_prefecture ?? '',
        location_city: updatedProfile.location_city ?? '',
        bio: updatedProfile.bio ?? '',
        website_url: updatedProfile.website_url ?? '',
        phone_number: updatedProfile.phone_number ?? '',
        certification_info: updatedProfile.certification_info ?? '',
        is_producer: updatedProfile.is_producer ?? false,
      });
      setCurrentImageUrl(updatedProfile.image); // 画像URLも更新
      setImageFile(null); // ファイル選択状態をリセット
      alert('プロフィールが更新されました！');
    } catch (error) {
      console.error('Failed to update profile', error);
      if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
        setErrors(error.response.data as Record<string, string[]>);
        alert('入力内容にエラーがあります。確認してください。');
      } else if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`);
      } else {
        alert('プロフィールの更新中に予期せぬエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 画像URLの組み立てロジック
  let imageUrl: string | undefined = undefined;
  const imagePath = currentImageUrl; // 表示/プレビュー用のURLを使用

  if (imagePath) {
    if (imagePath.startsWith('data:')) { // データURL (プレビュー)
      imageUrl = imagePath;
    } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      imageUrl = imagePath;
      console.warn('Image path is an absolute URL:', imagePath);
    } else if (imagePath.startsWith('/')) { // 相対パス (期待する形式 /media/...)
      imageUrl = `${mediaBaseUrl}${imagePath}`;
    } else { // 予期しない形式
      console.error('Unexpected image path format:', imagePath);
    }
  }

  // ローディング表示
  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}>
      <CircularProgress />
    </Container>;
  }

  // データ取得失敗時のエラー表示
  if (!isLoading && errors.detail && !profile) {
    return <Container sx={{ mt: 4 }}><Alert severity='error'>{errors.detail as string}</Alert></Container>;
  }
  // 万が一 profile が null の場合
  if (!profile) {
    return <Container sx={{ mt: 4 }}><Alert severity='error'>プロフィールデータを表示できません。</Alert></Container>;
  }


  return (
    <WithProducerAuth>
      <Container maxWidth='md' sx={{ my: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {/* 画像セクション */}
            <Grid sx={{ xs: 12 }}>
              <Typography variant='h6' gutterBottom>プロフィール画像</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
                <Avatar
                  src={imageUrl ?? undefined}
                  alt={formData.farm_name || 'プロフィール画像'}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'grey.200',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  variant='rounded'
                >
                  {!imageUrl && <PhotoCamera />}
                </Avatar>
                <input
                  type='file'
                  id='profileImageInput'
                  name='image'
                  hidden
                  accept='image/*'
                  onChange={handleImageChange}
                />
                <Button
                  variant='contained'
                  onClick={() => document.getElementById('profileImageInput')?.click()}
                  className={styles.imageChangeButton}
                >
                  画像を変更
                </Button>
                {/* 画像削除ボタン */}
                {currentImageUrl && (
                  <Button
                    variant='outlined'
                    onClick={handleImageDelete}
                    startIcon={<DeleteIcon />}
                    disabled={isSubmitting} // 送信中は無効化
                  >
                    画像を削除
                  </Button>
                )}
              </Stack>
              {Array.isArray(errors.image) ? errors.image.join(', ') : errors.image}
            </Grid>
          </Grid>

          <div className={styles.formGroup}>
            {/* フォームフィールド */}
            <Grid sx={{ xs: 12 }}>
              <Typography variant='h6' gutterBottom sx={{mt: 2}}>
                基本情報
              </Typography>
            </Grid>
            <label
              htmlFor='farm_name'
              className={styles.label}
            >
              農園名/事業者名
            </label>
            <input
              type='text'
              id='farm_name'
              name='farm_name'
              value={formData.farm_name ?? ''}
              onChange={handleChange}
              className={styles.input}
            />
            {errors.farm_name && (
              <Typography color='error' variant='caption' sx={{ mt: 0.5 }}>
                {Array.isArray(errors.farm_name) ? errors.farm_name.join(', ') : errors.farm_name}
              </Typography>
            )}
            <div className={styles.formGroup}>
              <label
                htmlFor='location_prefecture'
                className={styles.label}
              >
                所在地 (都道府県)
              </label>
              <input
                type='text'
                id='location_prefecture'
                name='location_prefecture'
                value={formData.location_prefecture ?? ''}
                onChange={handleChange} className={styles.input}
              />
              {Array.isArray(errors.location_prefecture) ? errors.location_prefecture.join(', ') : errors.location_prefecture}
            </div>
            <div className={styles.formGroup}>
              <label
                htmlFor='location_city'
                className={styles.label}
              >
                所在地 (市区町村)
              </label>
              <input
                type='text'
                id='location_city'
                name='location_city'
                value={formData.location_city ?? ''}
                onChange={handleChange}
                className={styles.input}
              />
              {Array.isArray(errors.location_city) ? errors.location_city.join(', ') : errors.location_city}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label
              htmlFor='bio'
              className={styles.label}
            >
              自己紹介/こだわり
            </label>
            <textarea
              id='bio'
              name='bio'
              value={formData.bio ?? ''}
              onChange={handleChange}
              className={styles.textarea}
            />
            {Array.isArray(errors.bio) ? errors.bio.join(', ') : errors.bio}
          </div>

          <div className={styles.formGroup}>
            <label
              htmlFor='website_url'
              className={styles.label}
            >
              ウェブサイトURL
            </label>
            <input
              type='url'
              id='website_url'
              name='website_url'
              value={formData.website_url ?? ''}
              onChange={handleChange}
              className={styles.input}
              placeholder='https://example.com'
            />
            {Array.isArray(errors.website_url) ? errors.website_url.join(', ') : errors.website_url}
            </div>

          {/* 電話番号 */}
          <div className={styles.formGroup}>
            <label
              htmlFor='phone_number'
              className={styles.label}
            >
              電話番号
            </label>
            <input
              type='tel'
              id='phone_number'
              name='phone_number'
              value={formData.phone_number ?? ''}
              onChange={handleChange}
              className={styles.input}
            />
            {Array.isArray(errors.phone_number) ? errors.phone_number.join(', ') : errors.phone_number}
            </div>

          {/* 認証情報 */}
          <div className={styles.formGroup}>
            <label
              htmlFor='certification_info'
              className={styles.label}
            >
              認証情報
            </label>
            <textarea
              id='certification_info'
              name='certification_info'
              value={formData.certification_info ?? ''}
              onChange={handleChange}
              className={styles.textarea}
              placeholder='例: 有機JAS認定 第000号'
            />
            {Array.isArray(errors.certification_info) ? errors.certification_info.join(', ') : errors.certification_info}
          </div>

          {/* 生産者フラグ */}
          <div className={styles.formGroup}>
            <span className={styles.label}>生産者登録:</span>
            <span>{profile?.is_producer ? 'はい' : 'いいえ'}</span>
          </div>

          {/* 送信ボタン */}
          <Grid sx={{ xs: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              size="large"
            >
              {isSubmitting ? '更新中...' : 'プロフィールを更新'}
            </Button>
          </Grid>
          {Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join(', ') : errors.non_field_errors}
          {errors.detail && typeof errors.detail === 'string' && <p className={styles.errorTextOverall}>{errors.detail}</p>}
        </Box>
      </Container>
    </WithProducerAuth>
  );
}