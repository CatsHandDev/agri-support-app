// frontend/src/app/(authenticated)/favorites/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites'; // お気に入りフック
import { Product } from '@/types/product';
import WithAuth from '@/components/auth/WithAuth'; // 認証ガード
import {
  Container, Typography, Grid, Box, CircularProgress, Alert, Button, Paper
} from '@mui/material';
import ProductCard from '@/components/products/ProductCard';

function FavoritesPageContent() {
  const { favoriteItems, favoritesCount, loadFavorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" mb={4}>
        お気に入り商品 ({favoritesCount})
      </Typography>

      {favoritesCount === 0 ? (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            お気に入り登録された商品はありません。
          </Typography>
          <Button component={Link} href="/products" variant="contained" sx={{ mt: 3 }}>
            商品を探しに行く
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {favoriteItems.map((favItem) => (
            <Grid key={favItem.id} sx={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              {/* ProductCard を再利用 */}
              <ProductCard product={favItem.product} mediaBaseUrl={mediaBaseUrl} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}


export default function FavoritesPage() {
  return (
    <WithAuth> {/* ログイン必須 */}
      <FavoritesPageContent />
    </WithAuth>
  );
}
