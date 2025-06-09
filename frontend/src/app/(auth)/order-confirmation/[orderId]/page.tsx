// frontend/src/app/(authenticated)/order-confirmation/[orderId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; // ★ useState, useEffect をインポート
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WithAuth from '@/components/auth/WithAuth';
import { getOrderById } from '@/services/orderApi'; // ★ API 関数をインポート
import { Order } from '@/types/order'; // ★ Order, OrderItem 型をインポート
import {
  Container, Typography, Paper, Button, Box, CircularProgress, Alert, Divider, Stack, List, ListItem, ListItemText, Avatar, Card, CardContent, CardMedia,
  Grid
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Image from 'next/image';

function OrderConfirmationPageContent() {
  const params = useParams();
  const orderIdFromUrl = params.orderId as string; // URLから取得する注文ID (UUIDなど)
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null); // ★ 取得した注文データを保持
  const [isLoading, setIsLoading] = useState(true);     // ★ ローディング状態
  const [error, setError] = useState<string | null>(null); // ★ エラー状態

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // --- 注文詳細データ取得 ---
  useEffect(() => {
    if (orderIdFromUrl) {
      setIsLoading(true);
      setError(null);
      console.log(`[OrderConfirmation] Fetching order details for: ${orderIdFromUrl}`);
      getOrderById(orderIdFromUrl)
        .then((data: React.SetStateAction<Order | null>) => {
          if (data) {
            setOrder(data);
            console.log('[OrderConfirmation] Order details fetched:', data);
          } else {
            setError("指定された注文が見つかりませんでした。");
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch order details", err);
          setError("注文情報の読み込みに失敗しました。");
        })
        .finally(() => setIsLoading(false));
    } else if (orderIdFromUrl) { // URL に orderId はあるが、まだ準備できていないなどの場合
      console.warn("[OrderConfirmation] orderIdFromUrl is present but not yet a valid string for API call, waiting...", orderIdFromUrl);
      // 意図的にローディングを継続させるか、エラーにするか
      // setIsLoading(false); // またはエラーセット
      // setError("注文IDの取得に問題が発生しました。");
    } else {
      // そもそも orderIdFromUrl がない (URLが不正など)
      console.error("[OrderConfirmation] orderIdFromUrl is missing or invalid.");
      setError("注文IDが指定されていません。");
      setIsLoading(false);
    }
  }, [orderIdFromUrl]); // orderIdFromUrl が変わったら再取得

  // --- ローディング・エラー表示 ---
  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 8 }}><CircularProgress size={50} /></Container>;
  }
  if (error || !order) {
    return (
      <Container sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">{error || '注文情報を表示できません。'}</Typography>
          <Button component={Link} href="/" variant="outlined" sx={{ mt: 2 }}>トップページへ戻る</Button>
        </Alert>
      </Container>
    );
  }

  // --- 注文詳細表示 ---
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 70, color: 'success.main' }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mt: 1 }}>
            ご注文ありがとうございます！
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            注文ID: {order.order_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ご注文日時: {new Date(order.created_at).toLocaleString('ja-JP')}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 注文商品 */}
        <Typography variant="h6" gutterBottom>ご注文商品</Typography>
        <Grid container spacing={2}>
          {order.items && Array.isArray(order.items) && order.items.map((item) => {
            // ★ item.product が存在することを確認 (APIレスポンス形式による)
            //    OrderSerializer で ProductSerializer をネストしていれば item.product に商品情報がある
            const productInfo = item.product; // OrderItemSerializer で product をネストしている場合
            const imageUrl = productInfo?.image ? `${mediaBaseUrl}${productInfo.image}` : null;

            return (
              <Grid sx={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <Card sx={{ display: 'flex', height: '100%' }}>
                  {imageUrl && (
                    <CardMedia sx={{ width: {xs: 80, sm:100}, height: {xs: 80, sm:100}, flexShrink: 0 }}>
                      <Image
                      src={imageUrl}
                      alt={item.product_name}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </CardMedia>
                  )}
                  {!imageUrl && (
                    <Box sx={{ width: {xs: 80, sm:100}, height: {xs: 80, sm:100}, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                      <Typography variant="caption" color="text.secondary">画像なし</Typography>
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, p: {xs:1, sm:2} }}>
                    <Typography variant="subtitle2" fontWeight="medium" gutterBottom component="div" noWrap title={item.product_name}>
                      {item.product_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      数量: {item.quantity} 点
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      単価: {parseInt(item.price_at_purchase).toLocaleString()} 円
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* 合計金額 */}
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1, mt: 2 }}>
          <Typography variant="h6" fontWeight="medium">商品小計</Typography>
          <Typography variant="h6" fontWeight="medium">{parseFloat(order.total_amount).toLocaleString()} 円</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography color="text.secondary">送料</Typography>
          <Typography color="text.secondary">別途計算</Typography>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h5" fontWeight="bold">お支払い合計</Typography>
          <Box textAlign="right">
            <Typography variant="h5" fontWeight="bold" color="primary.dark">
              {parseFloat(order.total_amount).toLocaleString()} 円
            </Typography>
            <Typography variant="caption" component="div">(税込・送料別)</Typography>
          </Box>
        </Stack>


        <Divider sx={{ my: 3 }} />

        {/* 配送先情報 */}
        <Typography variant="h6" gutterBottom>お届け先</Typography>
        <Box sx={{ pl: 1, color: 'text.secondary', fontSize: '0.9rem' }}>
          <Typography>お名前: {order.shipping_full_name}</Typography>
          <Typography>郵便番号: 〒{order.shipping_postal_code}</Typography>
          <Typography>住所: {order.shipping_prefecture}{order.shipping_city}{order.shipping_address1} {order.shipping_address2 || ''}</Typography>
          <Typography>電話番号: {order.shipping_phone_number}</Typography>
        </Box>

        {order.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>備考</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{order.notes}</Typography>
          </>
        )}

        <Stack spacing={2} direction="row" justifyContent="center" sx={{ mt: 5 }}>
          <Button component={Link} href="/products" variant="outlined" size="large">
            お買い物を続ける
          </Button>
          <Button component={Link} href="/my-orders" /* 注文履歴ページ (未作成) */ variant="contained" size="large">
            注文履歴を見る
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

export default function OrderConfirmation() {
  return (
    <WithAuth> {/* ログイン必須 */}
      <OrderConfirmationPageContent />
    </WithAuth>
  );
}