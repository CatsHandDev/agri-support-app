// frontend/src/components/products/ProductCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import {
  Card, CardActionArea, CardMedia, CardContent, Typography, Box, Chip, IconButton, Tooltip, Button,
} from '@mui/material';
import { FavoriteBorder, Favorite as FavoriteIcon, AddShoppingCart } from '@mui/icons-material';
import { useCart } from '@/hooks/useCart'; // useCart フックをインポート
import { useFavorites } from '@/hooks/useFavorites'; // ★ useFavorites フックをインポート
import { useAuth } from '@/hooks/useAuth'; // 認証状態取得のため
import { useRouter } from 'next/navigation'; // リダイレクト用

interface ProductCardProps {
  product: Product;
  mediaBaseUrl: string;
}

export default function ProductCard({ product, mediaBaseUrl }: ProductCardProps) {
  const { addToCart } = useCart(); // カート追加関数を取得
  const { isFavorite, toggleFavorite } = useFavorites(); // ★ お気に入りフックを使用
  const { isAuthenticated } = useAuth(); // ログイン状態を取得
  const router = useRouter();

  const imageUrl = product.image ? `${product.image}` : null;

  const handleActualAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
        alert('カートに追加するにはログインが必要です。');
        router.push(`/login?redirect=/products/${product.id}`); // 元のページに戻るように
        return;
    }
    addToCart(product, 1); // 数量1でカートに追加
    // (任意) カートに追加した旨の通知 (Toastなど)
    alert(`${product.name} をカートに追加しました。`);
  };

  const handleToggleFavoritesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
        alert('お気に入り機能を利用するにはログインが必要です。');
        router.push(`/login?redirect=/products`); // 商品一覧に戻る想定
        return;
    }
    toggleFavorite(product.id); // ★ トグル関数を呼び出し
  };

  const isCurrentlyFavorite = isFavorite(product.id); // ★ 現在お気に入りかどうか

  return (
    <Card sx={{
      height: '100%', // 親の Grid アイテムの高さいっぱいに広がるように
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), transform 0.3s cubic-bezier(.25,.8,.25,1)', // 滑らかな変化
      '&:hover': {
        boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.12)', // よりリッチな影
        transform: 'translateY(-4px)', // 少し浮き上がる効果
      },
      borderRadius: '12px', // 角丸を少し大きく
      overflow: 'hidden', // 画像のはみ出し防止
    }}>
      {/* CardActionArea: カード全体をクリック可能にし、波紋エフェクトを追加 */}
      <CardActionArea component={Link} href={`/products/${product.id}`} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
        {/* --- 画像表示エリア --- */}
        <Box sx={{ position: 'relative', width: '100%', pt: '75%' /* 4:3 のアスペクト比 */ }}>
          <CardMedia sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'grey.200' }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, (max-width: 1200px) 33vw, 25vw"
                // priority={/* index < 4 などで最初の数枚に true */}
                // unoptimized={true} // 必要に応じて
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'grey.500' }}>
                <Typography variant="caption">画像なし</Typography>
              </Box>
            )}
          </CardMedia>
          {/* ラベル (例: NEW - product に is_new フラグなどが必要) */}
          {/* {product.is_new && <Chip label="NEW" color="secondary" size="small" sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'secondary.light', fontWeight: 'bold' }} />} */}
          {/* SALE ラベルなども同様 */}
          {/* お気に入りボタン */}
          <Tooltip title={isCurrentlyFavorite ? "お気に入りから削除" : "お気に入りに追加"}>
             {/* ★ IconButton のアイコンと色を状態に応じて変更 */}
            <IconButton
              onClick={handleToggleFavoritesClick} // ★ 修正したハンドラ
              size="small"
              sx={{
                position: 'absolute', top: 8, right: 8,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                color: isCurrentlyFavorite ? 'error.main' : 'action.active', // ★ 色を変更
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                zIndex: 1,
              }}
            >
              {/* ★ アイコンを状態に応じて変更 */}
              {isCurrentlyFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorder fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* --- コンテンツエリア --- */}
        <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {/* 生産者名 */}
          <Typography variant="caption" color="text.secondary" gutterBottom noWrap
              component={Link} href={`/producers/${product.producer_username}`} /* 生産者ページへのリンク */
              onClick={(e) => e.stopPropagation()} /* カード全体のリンクと干渉しないように */
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
            {product.producer_username}
          </Typography>
          {/* 商品名 (2行まで表示) */}
          <Typography
            variant="subtitle1" // h6より少し小さい
            fontWeight="medium"
            title={product.name}
            sx={{
              mb: 1,
              color: 'text.primary',
              // 2行まで表示して...で省略
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              minHeight: '3em', // 高さを確保してガタつきを防ぐ (line-height に依存)
              lineHeight: 1.5, // line-height を指定
              textDecoration: 'none', // Link スタイル打ち消し
            }}
          >
            {product.name}
          </Typography>
           {/* 価格 */}
          <Box sx={{ mt: 'auto', pt: 1 }}> {/* mt: auto で下寄せ */}
            <Typography variant="h6" fontWeight="bold" component="div" color="primary.dark"> {/* 強調色 */}
              {parseInt(product.price, 10).toLocaleString()} 円
              <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 0.5 }}>(税込)</Typography>
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* --- アクションエリア (カートボタン) --- */}
      {/* CardActionArea の外に出すことで、カード全体クリックとボタンクリックを区別 */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
            variant="contained"
            color="primary" // 緑色に合わせる (theme で primary が #16a34a になっている想定)
            fullWidth
            size="medium"
            startIcon={<AddShoppingCart />}
            onClick={handleActualAddToCart}
            sx={{
              textTransform: 'none', // 大文字変換しない
              fontWeight: 'bold',
              // bgcolor: '#16a34a', // 直接指定も可
              // '&:hover': { bgcolor: '#15803d' }
            }}
        >
            カートに入れる
        </Button>
      </Box>
    </Card>
  );
}