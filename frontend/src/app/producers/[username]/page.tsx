// frontend/src/app/producers/[username]/page.tsx
'use client'; // データ取得のため

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { getProducerProfileByUsername } from '@/services/profileApi'; // プロフィール取得
import { getProducts, ProductApiFilters } from '@/services/productApi'; // 商品取得
import { Profile } from '@/types/profile';
import { Product } from '@/types/product';
import {
  Container, Box, Typography, Grid, CircularProgress, Alert, Paper, Avatar, Chip, Stack, Divider, Pagination, Breadcrumbs, Link as MuiLink,
  Button
} from '@mui/material';
import ProductCard from '@/components/products/ProductCard'; // 商品カードを再利用
import Link from 'next/link';

const ITEMS_PER_PAGE = 8; // 生産者ページでの商品表示件数

export default function ProducerDetailPage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(1);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';
  const totalProductPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // --- データ取得 ---
  useEffect(() => {
    if (username) {
      setIsLoadingProfile(true);
      setIsLoadingProducts(true); // 両方ローディング開始
      setError(null);

      let fetchedProfile: Profile | null = null; // プロフィールを一時保存

      // 1. プロフィール取得
      getProducerProfileByUsername(username)
        .then(profileData => {
          if (profileData) {
            fetchedProfile = profileData; // 取得成功
            setProfile(profileData);
          } else {
            setError("生産者が見つかりません。");
            // notFound(); // Client Component では router.push('/not-found') など
          }
        })
        .catch(err => {
          console.error("Failed to fetch producer profile", err);
          setError("プロフィールの読み込みに失敗しました。");
        })
        .finally(() => setIsLoadingProfile(false));

      // 2. 商品リスト取得 (プロフィール取得とは非同期で実行可能)
      const productFilters: ProductApiFilters = {
        producer_username: username, // ★ ユーザー名でフィルタ
        page: currentProductPage,
        limit: ITEMS_PER_PAGE,
        // status: 'active' は getProducts 内で設定済み想定
      };
      getProducts(productFilters)
        .then(response => {
          // ★ API レスポンス形式に合わせて調整
          const results = response;
          const count = results.length;
          setProducts(results);
          setTotalProducts(count);
        })
        .catch(err => {
          console.error("Failed to fetch producer products", err);
          // 商品取得エラーは致命的ではないかもしれない
          setError(prev => prev ? `${prev}\n商品の読み込みに失敗しました。` : "商品の読み込みに失敗しました。");
        })
        .finally(() => setIsLoadingProducts(false));
    } else {
      setError("無効なユーザー名です。");
      setIsLoadingProfile(false);
      setIsLoadingProducts(false);
    }
  }, [username, currentProductPage]); // username またはページが変わったら再取得

  // --- 商品ページネーションハンドラ ---
  const handleProductPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentProductPage(value);
    window.scrollTo(0, 0); // 上部にスクロール
  };

  // --- ローディング・エラー表示 ---
  if (isLoadingProfile) { // まずプロフィールのロードを待つ
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }
  if (error || !profile) { // エラーまたはプロフィールが見つからない
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || '生産者情報を表示できません。'}</Alert>
        <Button component={Link} href="/producers" sx={{ mt: 2 }}>生産者一覧に戻る</Button> {/* 生産者一覧へのリンク */}
      </Container>
    );
  }

  // --- レンダリング ---
  const profileImageUrl = profile.image ? `${mediaBaseUrl}${profile.image}` : undefined;
  const producerDisplayName = profile.farm_name || profile.username;

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* パンくずリスト (任意) */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <MuiLink component={Link} underline="hover" color="inherit" href="/">ホーム</MuiLink>
          <MuiLink component={Link} underline="hover" color="inherit" href="/producers">生産者一覧</MuiLink>
          <Typography color="text.primary">{producerDisplayName}</Typography>
      </Breadcrumbs>

      {/* 生産者プロフィールヘッダー */}
      <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, mb: 5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3 }}>
        <Avatar
          src={profileImageUrl}
          alt={producerDisplayName}
          sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 }, bgcolor: 'primary.light', fontSize: '3rem' }}
        >
          {!profileImageUrl && producerDisplayName ? producerDisplayName.charAt(0).toUpperCase() : null}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {producerDisplayName}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {profile.location_prefecture || ''} {profile.location_city || ''}
          </Typography>
          {/* 特徴 Chip など */}
          {/* <Chip label="有機栽培" size="small" variant="outlined" sx={{ mr: 1 }} /> */}
          {/* ウェブサイトリンクなど */}
          {profile.website_url && (
            <MuiLink href={profile.website_url} target="_blank" rel="noopener noreferrer" underline="hover">
              ウェブサイトを見る
            </MuiLink>
          )}
        </Box>
      </Paper>

      {/* 自己紹介・こだわり */}
      {profile.bio && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" gutterBottom>自己紹介・こだわり</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {profile.bio}
          </Typography>
        </Box>
      )}

      {/* 認証情報など */}
      {profile.certification_info && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" gutterBottom>認証・資格など</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {profile.certification_info}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 5 }} />

      {/* この生産者の商品一覧 */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" mb={3}>
        {producerDisplayName} の商品
      </Typography>
      {isLoadingProducts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Typography>現在販売中の商品はありません。</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid key={product.id} sx={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard product={product} mediaBaseUrl={mediaBaseUrl} />
              </Grid>
            ))}
          </Grid>
          {/* 商品リストのページネーション */}
          {totalProductPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
              <Pagination
                count={totalProductPages}
                page={currentProductPage}
                onChange={handleProductPageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
