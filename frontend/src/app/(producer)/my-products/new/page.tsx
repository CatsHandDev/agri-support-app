// frontend/src/app/(producer)/my-products/new/page.tsx
'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/services/productApi';
import { Product } from '@/types/product'; // Product 型をインポート
import styles from './page.module.scss'; // SCSS をインポート
import { AxiosError } from 'axios';
import {
  Container, Box, Typography, TextField, Button, Grid, Select, MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, CircularProgress, Alert, IconButton, Avatar, Stack, SelectChangeEvent
} from '@mui/material';
import { PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material';
import Link from 'next/link';
import WithProducerAuth from '@/components/auth/withProducerAuth';

// 選択肢データ (必要に応じて constants ファイルからインポート)
const UNIT_CHOICES = [
  { value: 'kg', label: 'キログラム' }, { value: 'g', label: 'グラム' }, { value: 'ko', label: '個' },
  { value: 'fukuro', label: '袋' }, { value: 'hako', label: '箱' }, { value: 'taba', label: '束' },
];
const CULTIVATION_CHOICES = [
  { value: 'conventional', label: '慣行栽培' }, { value: 'special', label: '特別栽培' },
  { value: 'organic', label: '有機栽培(認証なし)' }, { value: 'organic_jas', label: '有機栽培(JAS)' },
  { value: 'natural', label: '自然栽培' },
];
// 新規登録時は status は不要なことが多い (バックエンドで draft になる想定)
// const STATUS_CHOICES = [ /* ... */ ];

// フォームデータの型 (image 除外)
type ProductFormData = Omit<Partial<Product>, 'id' | 'producer_username' | 'created_at' | 'updated_at' | 'status_display' | 'unit_display' | 'cultivation_method_display' | 'image' | 'status' | 'is_producer' >; // status, is_producer も除外

// フォームの初期値
const initialFormData: ProductFormData = {
  name: '', description: '', category: '', price: '', quantity: '', unit: UNIT_CHOICES[0].value, // 単位にデフォルト値
  standard: '', cultivation_method: '', // 栽培方法もデフォルトなしに
  harvest_時期: '', shipping_available_時期: '',
  allergy_info: '', storage_method: '',
};

export default function NewProductPage() {
  const router = useRouter();
  // 認証チェックは WithProducerAuth が行う

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // プレビュー用
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000'; // 画像表示に使うかも

  // --- Event Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const target = e.target;
    const name = target.name as keyof ProductFormData; // name を ProductFormData のキーとして扱う

    if (!name) { console.warn("handleChange on element without name"); return; }

    let value: string | boolean;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked;
    } else {
      value = target.value;
    }

    setFormData((prev) => ({ ...prev, [name]: value as any })); // value の型を any にキャスト (一時的)

    // エラークリア
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
      reader.onloadend = () => { setCurrentImageUrl(reader.result as string); };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setCurrentImageUrl(null); // プレビューもクリア
    }
    // エラークリア
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const handleImageDelete = () => {
    setImageFile(null);
    setCurrentImageUrl(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    const newProductFormData = new FormData();

    // FormData にデータを追加 (空でない値のみ)
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        newProductFormData.append(key, String(value)); // 文字列に変換
      }
    });
    // 画像ファイルを追加
    if (imageFile) {
      console.log(imageFile)
      newProductFormData.append('image', imageFile);
    } else {
      console.log('no image file');
    }

    try {
      const newProduct = await createProduct(newProductFormData);
      setSubmitSuccess(true);
      setErrors({});
      alert('商品が登録されました！');
      router.push(`/my-products/${newProduct.id}`);
    } catch (error) {
      console.error('Failed to create product:', error);
      if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
        setErrors(error.response.data as Record<string, string[]>);
        alert('入力内容にエラーがあります。確認してください。');
      } else if (error instanceof Error) {
        setErrors({ detail: [error.message] });
      } else {
        setErrors({ detail: ['商品の登録中に予期せぬエラーが発生しました。'] });
      }
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WithProducerAuth> {/* ★ ページ全体をラップ */}
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* --- ページヘッダー --- */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              新しい商品を登録
            </Typography>
            <Button component={Link} href="/my-products" variant="outlined" size="small">
              商品管理に戻る
            </Button>
          </Stack>

          {/* --- メッセージ表示 --- */}
          {submitSuccess && <Alert severity="success" sx={{ mb: 3 }}>商品を登録しました。</Alert>}
          {errors.detail && <Alert severity="error" sx={{ mb: 3 }}>{errors.detail.join(', ')}</Alert>}
          {errors.non_field_errors && <Alert severity="error" sx={{ mb: 3 }}>{errors.non_field_errors.join(', ')}</Alert>}

          {/* --- フォーム本体 (Grid と Stack を使用) --- */}
          <Grid container spacing={3}>
            {/* 画像セクション */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>画像</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center"> {/* レスポンシブ対応 */}
                <Avatar
                  src={currentImageUrl ?? undefined} // プレビュー画像
                  alt="商品画像プレビュー"
                  sx={{ width: 120, height: 120, bgcolor: 'grey.200', border: '1px solid', borderColor: 'divider' }}
                  variant="rounded"
                >
                  {!currentImageUrl && <PhotoCamera />}
                </Avatar>
                <Stack spacing={1} alignItems={{ xs: 'center', sm: 'flex-start' }}> {/* レスポンシブ対応 */}
                  <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                    画像を選択
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  {currentImageUrl && (
                    <Button variant="outlined" color="error" onClick={handleImageDelete} startIcon={<DeleteIcon />} size="small">
                      画像を削除
                    </Button>
                  )}
                  {imageFile && <Typography variant="caption">選択中: {imageFile.name}</Typography>}
                  {errors.image && <Typography color="error" variant="caption">{errors.image.join(', ')}</Typography>}
                </Stack>
              </Stack>
            </Grid>

            {/* 基本情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{mt: 2}}>
                基本情報
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
              required
              fullWidth
              id="name"
              label="商品名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name?.join(', ')}
              disabled={isSubmitting}
            />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                id="description"
                label="商品説明"
                name="description"
                multiline rows={4}
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description?.join(', ')}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                id="price"
                label="価格 (円)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price?.join(', ')}
                disabled={isSubmitting}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                id="quantity"
                label="数量"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity?.join(', ')}
                disabled={isSubmitting}
                InputProps={{ inputProps: { min: 0, step: "any" } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl
                fullWidth
                required
                error={!!errors.unit}
                disabled={isSubmitting}
              >
                <InputLabel id="unit-label">単位</InputLabel>
                <Select
                  labelId="unit-label"
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  label="単位"
                  onChange={handleChange}
                >
                  {UNIT_CHOICES.map(choice => (<MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>))}
                </Select>
                {errors.unit && <Typography color="error" variant="caption">{errors.unit.join(', ')}</Typography>}
              </FormControl>
            </Grid>

            {/* 詳細情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                gutterBottom sx={{mt: 2}}
              >
                詳細情報
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                id="category"
                label="カテゴリ"
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={!!errors.category} helperText={errors.category?.join(', ')}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                id="standard"
                label="規格"
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                error={!!errors.standard}
                helperText={errors.standard?.join(', ')}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl
                fullWidth
                error={!!errors.cultivation_method}
                disabled={isSubmitting}
              >
                <InputLabel id="cultivation-label">栽培方法</InputLabel>
                <Select
                  labelId="cultivation-label"
                  id="cultivation_method"
                  name="cultivation_method"
                  value={formData.cultivation_method ?? ''}
                  label="栽培方法"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>選択しない</em></MenuItem>
                  {CULTIVATION_CHOICES.map(choice => (<MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>))}
                </Select>
                {errors.cultivation_method && <Typography color="error" variant="caption">{errors.cultivation_method.join(', ')}</Typography>}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="収穫時期"
                name="harvest_時期"
                value={formData.harvest_時期}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="出荷可能時期"
                name="shipping_available_時期"
                value={formData.shipping_available_時期}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="アレルギー情報"
                name="allergy_info"
                value={formData.allergy_info}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="保存方法"
                name="storage_method"
                value={formData.storage_method}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </Grid>

            {/* 送信ボタン */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', xs: 12, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting
                  ? <CircularProgress size={20} color="inherit" />
                  : null}
                size="large"
              >
                {isSubmitting ? '登録中...' : '商品を登録する'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </WithProducerAuth>
  );
}