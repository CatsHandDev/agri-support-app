// frontend/src/app/(authenticated)/my-orders/[orderId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WithAuth from '@/components/auth/WithAuth';
import { getOrderById } from '@/services/orderApi'; // API 関数
import { Order } from '@/types/order'; // Order 型
import Image from 'next/image';
import {
  Container, Typography, Paper, Button, Box, CircularProgress, Alert, Divider, Stack, List, ListItem, ListItemText, Avatar, Card, CardContent, CardMedia, Chip, Breadcrumbs, Link as MuiLink
} from '@mui/material';
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // 注文完了ページとは少し趣が異なるので削除しても良い

function MyOrderDetailPageContent() {
  const params = useParams();
  const orderIdFromUrl = params.orderId as string;
  const router = useRouter(); // 戻るボタン用

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  useEffect(() => {
    if (orderIdFromUrl) {
      setIsLoading(true);
      setError(null);
      getOrderById(orderIdFromUrl)
        .then(data => {
          if (data) {
            setOrder(data);
          } else {
            setError(`注文 (ID: ${orderIdFromUrl}) が見つかりませんでした。`);
          }
        })
        .catch(err => {
          console.error("Failed to fetch order details", err);
          setError("注文情報の読み込みに失敗しました。");
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("注文IDが無効です。");
      setIsLoading(false);
    }
  }, [orderIdFromUrl]);

  // --- ローディング・エラー表示 ---
  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 8 }}><CircularProgress size={50} /></Container>;
  }

  // エラーまたは order が null の場合の処理を明確化
  if (error) { // まずエラーがあるかチェック
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ p: 3 }}>
          <Typography variant="h6">{error}</Typography>
          <Typography variant="body2" sx={{mt:1}}>
            注文ID: {orderIdFromUrl || '不明'}
          </Typography>
          <Button component={Link} href="/" variant="outlined" sx={{ mt: 3, mr: 1 }}>トップページへ</Button>
          <Button component={Link} href="/my-orders" variant="contained" sx={{ mt: 3 }}>注文履歴へ</Button>
        </Alert>
      </Container>
    );
  }

  if (!order) { // エラーはないが、order データがまだない (または見つからなかった) 場合
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ p: 3 }}>
          <Typography variant="h6">注文情報を読み込めませんでした。</Typography>
          <Typography variant="body2" sx={{mt:1}}>
            注文ID: {orderIdFromUrl || '不明'}
          </Typography>
          <Button component={Link} href="/my-orders" variant="outlined" sx={{ mt: 3 }}>注文履歴へ戻る</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={Link} underline="hover" color="inherit" href="/">ホーム</MuiLink>
        <MuiLink component={Link} underline="hover" color="inherit" href="/my-orders">注文履歴</MuiLink>
        <Typography color="text.primary">注文詳細 ({order.order_id.substring(0,8)}...)</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          注文詳細
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
            <Typography variant="subtitle1" color="text.secondary">注文ID: {order.order_id}</Typography>
            <Typography variant="body2" color="text.secondary">注文日時: {new Date(order.created_at).toLocaleString('ja-JP')}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={3}>
          <Typography variant="body1">支払い状況: <Chip label={order.payment_status} size="small" /*色分け*/ /></Typography>
          <Typography variant="body1">配送状況: <Chip label={order.order_status} size="small" /*色分け*/ /></Typography>
        </Stack>


        <Divider sx={{ my: 3 }} />
        {/* ... (注文商品リスト、合計金額、配送先情報 - OrderConfirmationPage と同様の表示) ... */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>ご注文商品</Typography>
        {/* ... 注文商品リスト (Grid, Cardなど) ... */}

        <Divider sx={{ my: 3 }} />
        {/* ... 合計金額 ... */}

        <Divider sx={{ my: 3 }} />
        {/* ... 配送先情報 ... */}


        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button component={Link} href="/my-orders" variant="outlined">
            注文履歴に戻る
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default function MyOrderDetail() {
  return (
    <WithAuth>
      <MyOrderDetailPageContent />
    </WithAuth>
  );
}
