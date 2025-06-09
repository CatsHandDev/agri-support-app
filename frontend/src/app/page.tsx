// frontend/src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getProducts } from '@/services/productApi'; // 商品取得 API をインポート
import { Product } from '@/types/product';
import { Profile } from '@/types/profile';
import Image from 'next/image';
import styles from './page.module.scss'; // ホームページ用のスタイル
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Person,
  Favorite,
  Menu as MenuIcon,
  ChevronRight,
  ChevronLeft,
  Facebook,
  Instagram,
  Twitter,
} from '@mui/icons-material';
// import Carousel from 'react-material-ui-carousel'
import { getNewProducts, getFeaturedProducts } from '@/services/productApi';
import ProductCard from '@/components/products/ProductCard';
import { getLatestProducers } from '@/services/profileApi';
import ProducerCard from '@/components/producers/ProducerCard';

export default function HomePage() {
  const theme = useTheme()

  // 認証情報はヘッダー等で使うので取得はしておく (任意)
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [featuredProducers, setFeaturedProducers] = useState<Profile[]>([]); // 生産者用 state
  const [isLoadingProducers, setIsLoadingProducers] = useState(true); // 生産者用ローディング

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return
    }
    setDrawerOpen(open)
  }

  const categories = [
    { name: '野菜', image: '/vegi.jpg?height=120&width=120' },
    { name: '果物', image: '/fruits.jpg?height=120&width=120' },
    { name: 'お米・穀物', image: '/grain.jpg?height=120&width=120' },
    { name: '加工品', image: '/processed.jpg?height=120&width=120' },
    { name: '季節限定', image: '/season.jpg?height=120&width=120' },
    { name: 'ギフト', image: '/gift.jpg?height=120&width=120' },
  ]

// --- データ取得 useEffect ---
  useEffect(() => {
    let isMounted = true; // アンマウント対応

    const loadData = async () => {
      // おすすめ商品取得
      setIsLoadingFeatured(true);
      try {
        const featured = await getFeaturedProducts(5); // 例: 5件取得
        if (isMounted) setFeaturedProducts(featured);
      } catch (error) { console.error('Failed to load featured products', error); }
      finally { if (isMounted) setIsLoadingFeatured(false); }

      // 新着商品取得
      setIsLoadingNew(true);

      try {
        const newest = await getNewProducts(5); // 例: 5件取得
        if (isMounted) setNewProducts(newest);
      } catch (error) { console.error('Failed to load new products', error); }
      finally { if (isMounted) setIsLoadingNew(false); }

      // 注目の生産者取得
      setIsLoadingProducers(true);
      getLatestProducers(4)
      .then(data => setFeaturedProducers(data))
      .catch(error => console.error('Failed to load featured producers', error))
      .finally(() => setIsLoadingProducers(false));
    };

    loadData();

    return () => { isMounted = false; }; // クリーンアップ
  }, []); // 初回のみ実行

  // ローディング表示
  if (isLoadingFeatured || isLoadingNew) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  // 認証情報のローディング表示
  if (authLoading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      {isAuthenticated ? (
        <Box sx={{ bgcolor: '#F7F3E8', minHeight: '100vh' }}>
          {/* Mobile Drawer */}
          <Drawer anchor='left' open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box sx={{ width: 280, pt: 8, pb: 2 }} role='presentation'>
              <Box sx={{ px: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                <Image src='/placeholder.svg?height=40&width=40' alt='お野菜マルシェ・ハーベスト' width={40} height={40} />
                <Typography variant='h6' color='#16a34a' sx={{ ml: 1, fontWeight: 'bold' }}>
                  お野菜マルシェ
                </Typography>
              </Box>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href='/about'>
                    <ListItemText primary='About' />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href='/categories'>
                    <ListItemText primary='カテゴリー' />
                    <ChevronRight />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href='/pricing'>
                    <ListItemText primary='価格' />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href='/resources'>
                    <ListItemText primary='リソース' />
                    <ChevronRight />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} href='/contact'>
                    <ListItemText primary='お問い合わせ' />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Drawer>

          <main>
            {/* Hero Banner */}
            <Box sx={{ position: 'relative' }}>
              {/* <Carousel
                animation='slide'
                autoPlay
                interval={5000}
                indicators={true}
                navButtonsAlwaysVisible={true}
                navButtonsProps={{
                  style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                  },
                }}
              >
                <Box sx={{ position: 'relative', height: isMobile ? 300 : 400 }}>
                  <Image
                    src='/placeholder.svg?height=400&width=1200'
                    alt='新鮮な野菜を農家から直接お届け'
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      px: { xs: 3, md: 5 },
                    }}
                  >
                    <Typography variant={isMobile ? 'h4' : 'h3'} component='h1' color='white' fontWeight='bold' mb={1}>
                      農家から直接、新鮮な野菜をお届け
                    </Typography>
                    <Typography variant={isMobile ? 'body2' : 'body1'} color='white' mb={3} maxWidth='md'>
                      生産者の顔が見える安心・安全な食材を、市場価格よりもお得に
                    </Typography>
                    <Button variant='contained' color='primary' size='large' sx={{ width: 'fit-content' }}>
                      今すぐ買い物する
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ position: 'relative', height: isMobile ? 300 : 400 }}>
                  <Image
                    src='/placeholder.svg?height=400&width=1200'
                    alt='季節の特産品'
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      px: { xs: 3, md: 5 },
                    }}
                  >
                    <Typography variant={isMobile ? 'h4' : 'h3'} component='h1' color='white' fontWeight='bold' mb={1}>
                      季節の特産品を産地直送
                    </Typography>
                    <Typography variant={isMobile ? 'body2' : 'body1'} color='white' mb={3} maxWidth='md'>
                      旬の味わいをご自宅で。全国の厳選された生産者から直接お届け
                    </Typography>
                    <Button variant='contained' color='primary' size='large' sx={{ width: 'fit-content' }}>
                      特集を見る
                    </Button>
                  </Box>
                </Box>
              </Carousel> */}
            </Box>

            {/* Categories */}
            <Container sx={{ py: 6 }}>
              <Typography variant='h4' component='h2' color='#16a34a' fontWeight='bold' mb={3}>
                カテゴリーから探す
              </Typography>
              <Grid container spacing={3}>
                {categories.map((category, index) => (
                  <Grid sx={{ xs: 6, sm: 4, md: 2 }} key={index}>
                    <Box
                      component={Link}
                      href={`/products?category=${encodeURIComponent(category.name)}`} // ★ クエリパラメータでカテゴリを指定
                      sx={{ textDecoration: 'none', display: 'block' }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '100%',
                            width: '100%',
                            minWidth: '150px',
                            mb: 1,
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'white',
                          }}
                        >
                          <Image
                            src={category.image || '/placeholder.svg'}
                            alt={category.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </Box>
                        <Typography variant='subtitle1' color='text.primary' fontWeight={500}>
                          {category.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>

            {/* Featured Products (おすすめ商品) */}
            <Container sx={{ py: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h4' component='h2' color='primary.dark' fontWeight='bold'>
                  今週のおすすめ商品
                </Typography>
                <Button component={Link} href='/products?sort=featured' /* おすすめ一覧へのパス (任意) */ >もっと見る</Button>
              </Box>
              {isLoadingFeatured ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size={30} /></Box>
              ) : featuredProducts.length === 0 ? (
                <Typography>おすすめ商品はありません。</Typography>
              ) : (
                <Grid container spacing={3}>
                  {featuredProducts.map((product) => ( // ★ featuredProducts state を使用
                    <Grid key={product.id} sx={{ xs: 6, sm: 4, lg: 2.4 }}>
                      <ProductCard product={product} mediaBaseUrl={mediaBaseUrl} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Container>

            {/* New Arrivals (新着商品) */}
            <Container sx={{ py: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h4' component='h2' color='primary.dark' fontWeight='bold'>
                  新着商品
                </Typography>
                <Button component={Link} href='/products?sort=new' /* 新着一覧へのパス (任意) */ >もっと見る</Button>
              </Box>
              {isLoadingNew ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size={30} /></Box>
              ) : newProducts.length === 0 ? (
                <Typography>新着商品はありません。</Typography>
              ) : (
                <Grid container spacing={3}>
                  {newProducts.map((product) => ( // ★ newProducts state を使用
                    <Grid key={product.id} sx={{ xs: 6, sm: 4, lg: 2.4 }}>
                      <ProductCard product={product} mediaBaseUrl={mediaBaseUrl} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Container>

            {/* About Section */}
            <Box sx={{ bgcolor: '#e8f5e9', py: 6 }}>
              <Container>
                <Grid container sx={{ flexWrap: 'nowrap' }} spacing={4} alignItems='center'>
                  <Grid sx={{ xs: 12, md: 6 }} >
                    <Typography variant='h4' component='h2' color='#16a34a' fontWeight='bold' mb={2}>
                      生産者と消費者を直接つなぐ
                    </Typography>
                    <Typography variant='body1' color='text.secondary'>
                      お野菜マルシェ・ハーベストは、全国の厳選された農家さんから新鮮な農産物を直接お届けするサービスです。
                    </Typography>
                    <Typography variant='body1' color='text.secondary'>
                      中間マージンをカットすることで、生産者には適正な対価を、消費者には新鮮で安全な食材をお手頃価格でご提供しています。
                  </Typography>
                    <Typography variant='body1' color='text.secondary'>
                      すべての商品は生産者の顔が見える安心・安全なものばかり。産地直送だからこそ実現できる鮮度と味わいをぜひご体験ください。
                    </Typography>
                    <Button sx={{ mt: 1 }} variant='contained' color='primary' size='large' component={Link} href='/about'>
                      私たちについてもっと知る
                    </Button>
                  </Grid>
                  <Grid sx={{ xs: 12, md: 6 }} >
                    <Box
                      sx={{
                        position: 'relative',
                        height: 300,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src='/placeholder.svg?height=300&width=500'
                        alt='農家の方々'
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Container>
            </Box>

            {/* Featured Producers (注目の生産者) */}
            <Container sx={{ py: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h4' component='h2' color='primary.dark' fontWeight='bold'>
                  注目の生産者
                </Typography>
                <Button component={Link} href='/producers'>すべての生産者</Button>
              </Box>
              {isLoadingProducers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress size={30} /></Box>
              ) : featuredProducers.length === 0 ? (
                <Typography>注目の生産者はいません。</Typography>
              ) : (
                <Grid container spacing={3}>
                  {featuredProducers.map((profile) => ( // ★ featuredProducers state を使用
                    <Grid key={profile.id} sx={{ xs: 6, sm: 6, md: 3 }}>
                      {/* ★★★ 生産者カードを表示 ★★★ */}
                      <ProducerCard profile={profile} mediaBaseUrl={mediaBaseUrl} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Container>
          </main>
        </Box>
      ) : (
        // --- 未ログイン時の表示 ---
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
            ゲストログインID： guest
            <br />
            ゲストログインパスワード： guest
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='center' flexGrow={1} sx={{ mb: 4 }}>
            <Button component={Link} href='/login' variant='contained' size='large'>
              ログイン
            </Button>
            {/* 新規登録ボタン */}
            <Button component={Link} href='/register' variant='outlined' size='large'>
              新規登録
            </Button>
          </Stack>
          {/* <Button component={Link} href='/' variant='text' size='large'>
            ⇒ ログインなしで商品を見る
          </Button> */}
        </Box>
      )}
    </Container>
  )
}
