'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, updateProduct } from '@/services/productApi';
import { Product } from '@/types/product';
import Image from 'next/image';
import {
  Container, Box, Typography, TextField, Button, Grid, Select, MenuItem, InputLabel, FormControl,
  CircularProgress, Alert, Avatar, Stack, SelectChangeEvent
} from '@mui/material'; // MUIコンポーネントをインポート
import { PhotoCamera, Delete as DeleteIcon } from '@mui/icons-material'; // MUIアイコンをインポート
import { AxiosError } from 'axios';
import Link from 'next/link';
import WithProducerAuth from '@/components/auth/withProducerAuth';

// 選択肢データ (MUI Select で使いやすい形式)
const UNIT_CHOICES = [
  { value: 'kg', label: 'キログラム' }, { value: 'g', label: 'グラム' }, { value: 'ko', label: '個' },
  { value: 'fukuro', label: '袋' }, { value: 'hako', label: '箱' }, { value: 'taba', label: '束' },
];
const CULTIVATION_CHOICES = [
  { value: 'conventional', label: '慣行栽培' }, { value: 'special', label: '特別栽培' },
  { value: 'organic', label: '有機栽培(認証なし)' }, { value: 'organic_jas', label: '有機栽培(JAS)' },
  { value: 'natural', label: '自然栽培' },
];
const STATUS_CHOICES = [
  { value: 'draft', label: '下書き' }, { value: 'active', label: '販売中' }, { value: 'inactive', label: '販売停止' },
];

type ProductFormData = Omit<Partial<Product>, 'id' | 'producer_username' | 'created_at' | 'updated_at' | 'status_display' | 'unit_display' | 'cultivation_method_display' | 'image'>;

const initialFormData: ProductFormData = {
  name: '', description: '', category: '', price: '', quantity: '', unit: '',
  standard: '', cultivation_method: '', harvest_時期: '', shipping_available_時期: '',
  allergy_info: '', storage_method: '', status: 'draft',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  // --- State declarations ---
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({}); // APIからのエラー
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false); // 送信成功メッセージ用

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';
  const imagePath = currentImageUrl ?? originalProduct?.image;

  // 画像の最終的な URL を生成
  let imageUrl: string | undefined = undefined;
  if (imagePath) {
    if (imagePath.startsWith('data:')) {
      // データURL (プレビュー用) の場合はそのまま使う
      imageUrl = imagePath;
    } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // ★ もしバックエンドが絶対URLを返していた場合のフォールバック ★
      console.warn("Image path seems to be an absolute URL:", imagePath);
      imageUrl = imagePath; // そのまま使う
    } else if (imagePath.startsWith('/')) {
      // ★ 期待される相対パスの場合 (例: /media/...) ★
      imageUrl = `${mediaBaseUrl}${imagePath}`; // ベースURLと結合
      console.log(imageUrl);

    } else {
      // 予期しない形式の場合 (エラーログなどを出す)
      console.error("Unexpected image path format:", imagePath);
    }
  }
  // --- Fetch initial data ---
  useEffect(() => {
    let isMounted = true;

    if (productId) {
      setIsLoading(true);
      setSubmitSuccess(false); // メッセージリセット
      getProductById(productId)
        .then(data => {
          if (data) {
            setOriginalProduct(data);
            setFormData({
              name: data.name ?? '', description: data.description ?? '', category: data.category ?? '',
              price: data.price ?? '', quantity: data.quantity ?? '', unit: data.unit ?? '',
              standard: data.standard ?? '', cultivation_method: data.cultivation_method ?? '',
              harvest_時期: data.harvest_時期 ?? '', shipping_available_時期: data.shipping_available_時期 ?? '',
              allergy_info: data.allergy_info ?? '', storage_method: data.storage_method ?? '',
              status: data.status ?? 'draft',
            });
            setCurrentImageUrl(data.image);
            setErrors({});
          } else {
            setErrors({ detail: ['商品が見つかりません。'] });
          }
        })
        .catch(error => {
          if (!isMounted) return;
        console.error("Failed to fetch product", error);
        if (error instanceof AxiosError && error.response?.status === 403) {
          setErrors({ detail: ['この商品を編集する権限がありません。'] });
        } else if (error instanceof AxiosError && error.response?.status === 404) {
          setErrors({ detail: ['商品が見つかりません。'] });
        } else {
          setErrors({ detail: ['商品の読み込みに失敗しました。'] });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
  } else {
    if (!isMounted) return;
    setErrors({ detail: ['無効な商品IDです。'] });
    setIsLoading(false);
  }
  return () => { isMounted = false };
 }, [productId]);

  // --- Event Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | SelectChangeEvent<string>
  ) => {
    const target = e.target; // イベントターゲットを取得
    const name = target.name; // name 属性を取得

    // name 属性がない場合は処理しない (予期しない要素からのイベント防止)
    if (!name) {
      console.warn("handleChange called on element without a name attribute", target);
      return;
    }

    let value: string | boolean; // value の型を定義

    // target が HTMLInputElement かどうかをチェック
    if (target instanceof HTMLInputElement) {
      // さらに type が checkbox かどうかをチェック
      if (target.type === 'checkbox') {
        value = target.checked; // checkbox の場合は checked を使う
      } else {
        value = target.value; // それ以外の input は value を使う
      }
    }

    // target が HTMLTextAreaElement または HTMLSelectElement の場合
    else if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      value = target.value; // value を使う
    }
    // 想定外の要素タイプの場合は処理しない
    else {
      console.warn("handleChange called on unexpected element type", target);
      return;
    }

    setFormData((prev) => ({ ...prev, [name as string]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
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
    } else { setImageFile(null); }
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev }; // コピー
        delete newErrors.image;       // 'image' フィールドを削除
        return newErrors;             // 新しいオブジェクトを返す
      });
    }
  };

  const handleImageDelete = () => {
    setImageFile(null);
    setCurrentImageUrl(null); // プレビューも消す
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productId) return;
    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    const updateFormData = new FormData();

    // 文字列、数値、ステータスなどのフィールドを追加
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') { // 空文字も除外 (任意)
        updateFormData.append(key, String(value));
      }
    });
    // 画像ファイルを追加 (あれば)
    if (imageFile) {
      updateFormData.append('image', imageFile); // 新しいファイルがあれば追加
    } else if (currentImageUrl === null && originalProduct?.image) {
      // プレビューがなく(削除ボタンが押され)、かつ元のデータに画像があった場合、削除とみなす
      updateFormData.append('image', ''); // 空文字を送信 (API仕様による)
    }

    try {
      const updatedProduct = await updateProduct(productId, updateFormData);
      setOriginalProduct(updatedProduct);
      setFormData({ // フォームを更新後のデータで再初期化
        name: updatedProduct.name ?? '', description: updatedProduct.description ?? '', category: updatedProduct.category ?? '',
        price: updatedProduct.price ?? '', quantity: updatedProduct.quantity ?? '', unit: updatedProduct.unit ?? '',
        standard: updatedProduct.standard ?? '', cultivation_method: updatedProduct.cultivation_method ?? '',
        harvest_時期: updatedProduct.harvest_時期 ?? '', shipping_available_時期: updatedProduct.shipping_available_時期 ?? '',
        allergy_info: updatedProduct.allergy_info ?? '', storage_method: updatedProduct.storage_method ?? '',
        status: updatedProduct.status ?? 'draft',
      });
      setCurrentImageUrl(updatedProduct.image); // 画像URLも更新
      setImageFile(null); // ファイル選択状態リセット
      setSubmitSuccess(true); // 成功メッセージ表示フラグ
      window.scrollTo(0, 0); // ページトップにスクロール
    } catch (error) {
      console.error("Failed to update product", error);
      if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
        setErrors(error.response.data as Record<string, string[]>);
      } else if (error instanceof Error) {
        setErrors({ detail: [error.message] });
      } else {
        setErrors({ detail: ['商品の更新中に予期せぬエラーが発生しました。'] });
      }
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ★ ローディング表示
  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}>
      <CircularProgress />
    </Container>;
  }
  // ★ データ取得失敗時のエラー表示は残す
  if (!isLoading && errors.detail && !originalProduct) {
      return <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {errors.detail.join(', ')}
        </Alert>
      </Container>;
  }
  // ★ 万が一 originalProduct が null の場合 (通常はエラー表示されるはず)
  if (!originalProduct) {
      return <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          商品データを表示できません。
        </Alert>
      </Container>;
  }


  return (
    <WithProducerAuth>
      <Container maxWidth="md" sx={{ my: 4 }}> {/* my は上下マージン */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              商品を編集
            </Typography>
            <Button component={Link} href="/my-products" variant="outlined" size="small">
              商品管理に戻る
            </Button>
          </Stack>

          {/* --- 送信成功・エラーメッセージ --- */}
          {submitSuccess && <Alert severity="success" sx={{ mb: 3 }}>商品情報を更新しました。</Alert>}
          {errors.detail && <Alert severity="error" sx={{ mb: 3 }}>{errors.detail.join(', ')}</Alert>}
          {errors.non_field_errors && <Alert severity="error" sx={{ mb: 3 }}>{errors.non_field_errors.join(', ')}</Alert>}


          <Stack direction="column" spacing={2} alignItems="center">
            {/* --- 画像セクション --- */}
            <Stack
              sx={{
                border: '1px solid', // 枠線を追加 (色はデフォルトの境界線色)
                borderColor: 'divider', // MUIテーマの境界線色を使用 (例: lightgrey)
                borderRadius: 2, // 角丸 (テーマのspacing単位 x 2 = 16px)
                padding: 3, // 内側パディング (テーマのspacing単位 x 3 = 24px)
                marginLeft: '10%', // 左マージン
                marginRight: '10%', // 右マージン
                marginTop: 2, // 上マージン (テーマのspacing単位 x 2 = 16px)
                width: '80%', // 左右マージン 20% なので幅は 60%
                backgroundColor: '#f9fafb' // 背景色 (任意)
              }}
            >
              <Typography variant="h6" gutterBottom>画像</Typography>
              <Stack direction="column" spacing={2} alignItems="center">
                <Avatar
                  src={imageUrl ?? undefined}
                  alt={formData.name || "商品画像"}
                  sx={{ width: 120, height: 120, bgcolor: 'grey.200', border: '1px solid', borderColor: 'divider' }} // bgcolor は画像なしの場合の背景
                  variant="rounded" // または "square"
                >
                  {!currentImageUrl && <PhotoCamera />} {/* 画像なしの場合アイコン表示 */}
                </Avatar>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    component="label" // これで input type=file をラップできる
                    startIcon={<PhotoCamera />}
                    size="small"
                  >
                    画像を選択
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  {currentImageUrl && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleImageDelete}
                      startIcon={<DeleteIcon />}
                      size="small"
                    >
                      画像を削除
                    </Button>
                  )}
                  {imageFile && <Typography variant="caption">選択中: {imageFile.name}</Typography>}
                  {errors.image && <Typography color="error" variant="caption">{errors.image.join(', ')}</Typography>}
                </Stack>
              </Stack>
            </Stack>

            {/* --- 基本情報セクション --- */}
            <Stack
              direction="column"
              spacing={2}
              alignItems="flex-start"
              sx={{
                border: '1px solid', // 枠線を追加 (色はデフォルトの境界線色)
                borderColor: 'divider', // MUIテーマの境界線色を使用 (例: lightgrey)
                borderRadius: 2, // 角丸 (テーマのspacing単位 x 2 = 16px)
                padding: 3, // 内側パディング (テーマのspacing単位 x 3 = 24px)
                marginLeft: '10%', // 左マージン
                marginRight: '10%', // 右マージン
                marginTop: 2, // 上マージン (テーマのspacing単位 x 2 = 16px)
                width: '80%', // 左右マージン 20% なので幅は 60%
                backgroundColor: '#f9fafb' // 背景色 (任意)
              }}
            >
              <Typography variant="h6" gutterBottom>基本情報</Typography>
              <TextField
                required
                fullWidth
                id="name"
                label="商品名"
                name="name"
                value={formData.name ?? ''}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name?.join(', ')}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                required
                fullWidth
                id="description"
                label="商品説明"
                name="description"
                multiline
                rows={4}
                value={formData.description ?? ''}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description?.join(', ')}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  required
                  fullWidth
                  id="price"
                  label="価格 (円)"
                  name="price"
                  type="number"
                  value={formData.price ?? ''}
                  onChange={handleChange}
                  error={!!errors.price}
                  helperText={errors.price?.join(', ')}
                  disabled={isSubmitting}
                  InputProps={{ inputProps: { min: 0 } }}
                />
                <TextField
                  required
                  fullWidth
                  id="quantity"
                  label="数量"
                  name="quantity"
                  type="number"
                  value={formData.quantity ?? ''}
                  onChange={handleChange}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.join(', ')}
                  disabled={isSubmitting}
                  InputProps={{ inputProps: { min: 0, step: "any" } }}
                />
                <FormControl fullWidth required error={!!errors.unit} disabled={isSubmitting}>
                  <InputLabel id="unit-label">単位</InputLabel>
                  <Select
                    labelId="unit-label"
                    id="unit"
                    name="unit"
                    value={formData.unit ?? ''}
                    label="単位"
                    onChange={handleChange}
                  >
                    {UNIT_CHOICES.map(choice => (
                      <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.unit && <Typography color="error" variant="caption">{errors.unit.join(', ')}</Typography>}
                </FormControl>
              </Stack>
            </Stack>

            {/* --- 詳細情報セクション --- */}
            <Stack
              direction="column"
              spacing={2}
              alignItems="flex-start"
              sx={{
                border: '1px solid', // 枠線を追加 (色はデフォルトの境界線色)
                borderColor: 'divider', // MUIテーマの境界線色を使用 (例: lightgrey)
                borderRadius: 2, // 角丸 (テーマのspacing単位 x 2 = 16px)
                padding: 3, // 内側パディング (テーマのspacing単位 x 3 = 24px)
                marginLeft: '10%', // 左マージン
                marginRight: '10%', // 右マージン
                marginTop: 2, // 上マージン (テーマのspacing単位 x 2 = 16px)
                width: '80%', // 左右マージン 20% なので幅は 60%
                backgroundColor: '#f9fafb' // 背景色 (任意)
              }}
            >
              <Typography variant="h6" gutterBottom sx={{mt: 2}}>詳細情報</Typography>
              <TextField
                fullWidth
                id="category"
                label="カテゴリ"
                name="category"
                value={formData.category ?? ''}
                onChange={handleChange}
                error={!!errors.category}
                helperText={errors.category?.join(', ')}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                fullWidth
                id="standard"
                label="規格"
                name="standard"
                value={formData.standard ?? ''}
                onChange={handleChange}
                error={!!errors.standard}
                helperText={errors.standard?.join(', ')}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <FormControl fullWidth error={!!errors.cultivation_method} disabled={isSubmitting}>
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
                  {CULTIVATION_CHOICES.map(choice => (
                    <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
                  ))}
                </Select>
                {errors.cultivation_method && <Typography color="error" variant="caption">{errors.cultivation_method.join(', ')}</Typography>}
              </FormControl>
              <TextField
                fullWidth
                label="収穫時期"
                name="harvest_時期"
                value={formData.harvest_時期 ?? ''}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                fullWidth label="出荷可能時期"
                name="shipping_available_時期"
                value={formData.shipping_available_時期 ?? ''}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                fullWidth
                label="アレルギー情報"
                name="allergy_info"
                value={formData.allergy_info ?? ''}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                fullWidth
                label="保存方法"
                name="storage_method"
                value={formData.storage_method ?? ''}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ flexGrow: 1 }}
              />
            </Stack>

            {/* --- 設定セクション --- */}
            <Stack
              direction="column"
              spacing={2}
              alignItems="flex-start"
              sx={{
                border: '1px solid', // 枠線を追加 (色はデフォルトの境界線色)
                borderColor: 'divider', // MUIテーマの境界線色を使用 (例: lightgrey)
                borderRadius: 2, // 角丸 (テーマのspacing単位 x 2 = 16px)
                padding: 3, // 内側パディング (テーマのspacing単位 x 3 = 24px)
                marginLeft: '10%', // 左マージン
                marginRight: '10%', // 右マージン
                marginTop: 2, // 上マージン (テーマのspacing単位 x 2 = 16px)
                width: '80%', // 左右マージン 20% なので幅は 60%
                backgroundColor: '#f9fafb' // 背景色 (任意)
              }}
            >
              <Typography variant="h6" gutterBottom sx={{mt: 2}}>設定</Typography>
              <FormControl fullWidth required error={!!errors.status} disabled={isSubmitting}>
                <InputLabel id="status-label">ステータス</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status ?? 'draft'}
                  label="ステータス"
                  onChange={handleChange}
                  sx={{ flexGrow: 1 }}
                >
                  {STATUS_CHOICES.map(choice => (
                    <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
                  ))}
                </Select>
                  {errors.status && <Typography color="error" variant="caption">{errors.status.join(', ')}</Typography>}
              </FormControl>

              {/* --- 送信ボタン --- */}
              <Grid
                sx={{
                  width: '100%',
                  paddingTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center'
                  }}
                >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isSubmitting ? '更新中...' : '更新を保存する'}
                </Button>
              </Grid>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </WithProducerAuth>
  );
}