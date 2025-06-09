'use client'; // データ取得、フック利用のため

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useParams で ID 取得
import Image from 'next/image';
import { getProductById } from '@/services/productApi'; // API 関数
import { Product } from '@/types/product'; // 型定義
import { useAuth } from '@/hooks/useAuth'; // 認証情報取得 (任意)
import {
  Container, Box, Typography, Grid, CircularProgress, Alert, Button, Chip, Divider, Paper, Stack,
  Breadcrumbs, Link as MuiLink, // パンくずリスト用
  IconButton,
  TextField,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import { ShoppingCart, FavoriteBorder, Favorite as FavoriteIcon, Edit } from '@mui/icons-material';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated, isProducer, user } = useAuth(); // 認証情報
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // --- データ取得 ---
  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      getProductById(productId)
        .then(data => {
          if (data) {
            // 販売中の商品のみ表示するチェック (任意だが推奨)
            if (data.status === 'active' || (isAuthenticated && isProducer && data.producer_username === user?.username)) {
              setProduct(data);
            } else {
              setError("この商品は現在販売されていません。");
            }
          } else {
            setError("商品が見つかりません。");
          }
        })
        .catch(err => {
          console.error("Failed to fetch product", err);
          setError("商品の読み込みに失敗しました。");
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("無効な商品IDです。");
      setIsLoading(false);
    }
  }, [productId, isAuthenticated, isProducer, user?.username]); // 依存配列に認証情報も追加

  // --- ローディング・エラー表示 ---
  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }
  if (error || !product) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || '商品情報を表示できません。'}</Alert>
        <Button component={Link} href="/products" sx={{ mt: 2 }}>商品一覧に戻る</Button>
      </Container>
    );
  }

  const handleActualAddToCart = () => {
    if (!isAuthenticated) {
      alert('カートに追加するにはログインが必要です。');
      router.push(`/login?redirect=/products/${product?.id}`);
      return;
    }
    if (product) {
      addToCart(product, quantity);
      alert(`${product.name} を ${quantity}個 カートに追加しました。`);
    }
  };

  const handleToggleFavoritesClick = () => {
    if (!isAuthenticated) {
      alert('お気に入り機能を利用するにはログインが必要です。');
      router.push(`/login?redirect=/products/${product?.id}`);
      return;
    }
    if (product) {
      toggleFavorite(product.id);
    }
  };

  const isCurrentlyFavorite = product ? isFavorite(product.id) : false;

  // --- レンダリング ---
  const imageUrl = product.image ? `${product.image}` : null;

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* パンくずリスト (任意) */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink component={Link} underline="hover" color="inherit" href="/">
            ホーム
          </MuiLink>
          <MuiLink component={Link} underline="hover" color="inherit" href="/products">
            商品一覧
          </MuiLink>
          {/* カテゴリがあればカテゴリリンクを追加 */}
          {/* <MuiLink component={Link} underline="hover" color="inherit" href={`/products?category=${product.category}`}>
              {product.category}
          </MuiLink> */}
          <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}> {/* パディングを画面サイズで変更 */}
        <Grid container sx={{  }} spacing={{ xs: 3, md: 5 }}> {/* スペースを画面サイズで変更 */}
          <>
            {/* 画像エリア */}
            <Grid sx={{ xs: 12, md: 6 }}>
              <Box sx={{ position: 'relative', width: '400px', paddingTop: { xs: '100%', sm: '75%' }, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'grey.100' }}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'contain' }} // 全体表示
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 600px"
                    priority // 詳細ページでは優先読み込み
                    // unoptimized={true} // next.config.js で設定済みなら不要
                  />
                ) : (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.500' }}>
                    画像なし
                  </Box>
                )}
              </Box>
              {/* TODO: サムネイル画像など */}
            </Grid>
            <Stack sx={{ gap: 3 }}>
              {/* 生産者情報 */}
              <Box>
                <Typography variant="body2" color="text.secondary">生産者:</Typography>
                <MuiLink component={Link} href={`/producers/${product.producer_username}`} /* 生産者詳細ページへのリンク (要実装) */
                  variant="body1" fontWeight="medium" underline="hover">
                  {product.producer_username}
                </MuiLink>
              </Box>

              {/* 商品名 */}
              <Typography variant="h4" component="h1" fontWeight="bold">
                {product.name}
              </Typography>

              {/* 価格・単位 */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Typography variant="h5" color="primary.main" fontWeight="bold" mr={1}>
                  {parseInt(product.price, 10).toLocaleString()} 円
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  / {product.quantity} {product.unit_display} (税込)
                </Typography>
              </Box>

              {/* 商品説明 */}
              <Box>
                <Typography variant="h6" gutterBottom>商品説明</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}> {/* 改行を反映 */}
                  {product.description || '説明はありません。'}
                </Typography>
              </Box>
            </Stack>
          </>

          <Divider sx={{ my: 3 }} />

          {/* 情報エリア */}
          <Grid sx={{ xs: 12, md: 6 }}>
            <Stack direction="column" spacing={2} mt={2} alignItems="flex-start"> {/* 要素間のスペース */}

              {/* カート・お気に入りボタン */}
              <Stack direction="row" spacing={2} mt={2}>
                {/* 実需者のみ表示 */}
                {isAuthenticated && !isProducer && (
                  <>
                    {/* 数量入力 (任意) */}
                    <TextField
                      type="number"
                      label="数量"
                      size="small"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      sx={{ width: '80px' }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={handleActualAddToCart}
                      sx={{ flexGrow: 1 }} // 幅を広げる
                    >
                      カートに追加
                    </Button>
                  </>
                )}
                {/* ログインユーザーのみ表示 */}
                {isAuthenticated && (
                  <Tooltip title={isCurrentlyFavorite ? "お気に入りから削除" : "お気に入りに追加"}>
                    <IconButton
                      onClick={handleToggleFavoritesClick}
                      color={isCurrentlyFavorite ? "error" : "primary"} // 色を状態により変更
                    >
                      {isCurrentlyFavorite ? <FavoriteIcon /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>

              {/* 詳細情報 */}
              <Box>
                <Typography variant="h6" gutterBottom>詳細情報</Typography>
                <Grid container flexDirection='column' spacing={1} sx={{ fontSize: '0.9rem' }}>
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">カテゴリ：{product.category || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">規格：{product.standard || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">栽培方法：{product.cultivation_method_display || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">収穫時期：{product.harvest_時期 || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">出荷可能時期：{product.shipping_available_時期 || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">保存方法{product.storage_method || '-'}</Typography></Grid>
                  <Divider />
                  <Grid sx={{ xs: 6, sm: 4 }}><Typography color="text.secondary">アレルギー：{product.allergy_info || '-'}</Typography></Grid>
                  <Divider />
                </Grid>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}