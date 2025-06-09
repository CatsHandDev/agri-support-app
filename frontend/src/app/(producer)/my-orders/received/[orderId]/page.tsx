// frontend/src/app/(producer)/my-orders/received/[orderId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WithProducerAuth from '@/components/auth/withProducerAuth'; // 生産者ガード
import { getProducerOrderByOrderId, updateOrderStatusByProducer } from '@/services/orderApi'; // ★ API関数
import { Order, OrderItem } from '@/types/order';
import Image from 'next/image';
import {
  Container, Typography, Paper, Button, Box, CircularProgress, Alert, Divider, Stack, List, ListItem, ListItemText, Avatar, Card, CardContent, CardMedia, Breadcrumbs, Link as MuiLink, Grid, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Tooltip, Chip
} from '@mui/material';
import { EditNote, LocalShipping as ShipIcon, CheckCircle, ArrowBack } from '@mui/icons-material';

// OrderモデルのORDER_STATUS_CHOICESと合わせる
const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: '支払い待ち/処理待ち' },
    { value: 'processing', label: '発送準備中' },
    { value: 'shipped', label: '発送済み' },
    { value: 'completed', label: '取引完了' },
    { value: 'cancelled', label: 'キャンセル済み' },
];


function ProducerOrderDetailPageContent() {
  const params = useParams();
  const orderIdFromUrl = params.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // --- 注文詳細データ取得 ---
  useEffect(() => {
    if (orderIdFromUrl) {
      setIsLoading(true);
      setError(null);
      getProducerOrderByOrderId(orderIdFromUrl)
        .then(data => {
          if (data) {
            setOrder(data);
          } else {
            setError(`注文 (ID: ${orderIdFromUrl}) が見つかりませんでした。`);
          }
        })
        .catch(err => {
          console.error("Failed to fetch producer order details", err);
          setError("注文情報の読み込みに失敗しました。");
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("注文IDが無効です。");
      setIsLoading(false);
    }
  }, [orderIdFromUrl]);

  // --- ステータス更新ハンドラ ---
  const handleStatusChange = async (newStatus: Order['order_status']) => {
    if (!order || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await updateOrderStatusByProducer(order.order_id, newStatus);
      setOrder(updatedOrder); // 表示を更新
      alert(`注文ステータスを「${ORDER_STATUS_OPTIONS.find(o=>o.value===newStatus)?.label}」に変更しました。`);
    } catch (error: any) {
      console.error("Failed to update order status", error);
      alert(`ステータス更新に失敗: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- 発送完了メール送信ハンドラ ---
  const handleMarkAsShipped = async () => {
    if (!order || isUpdatingStatus) return;
    const { markOrderAsShipped } = await import('@/services/orderApi');

    if (!window.confirm('発送完了として注文者に通知メールを送信しますか？')) return;

    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await markOrderAsShipped(order.order_id);
      setOrder(updatedOrder);
      alert('発送完了メールを送信し、ステータスを更新しました。');
    } catch (error: any) {
      console.error("Failed to mark as shipped", error);
      alert(`発送処理に失敗: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  if (isLoading) { /* ... ローディング ... */ }
  if (error || !order) { /* ... エラー表示 ... */ }

  return (
    <>
      {order &&
        <Container maxWidth="lg" sx={{ my: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <MuiLink component={Link} underline="hover" color="inherit" href="/">ホーム</MuiLink>
            <MuiLink component={Link} underline="hover" color="inherit" href="/orders-received">受注管理</MuiLink>
            <Typography color="text.primary">受注詳細 ({order.order_id.substring(0,8)}...)</Typography>
          </Breadcrumbs>

          <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" component="h1" fontWeight="bold">受注詳細</Typography>
              <Button component={Link} href="/orders-received" startIcon={<ArrowBack />} size="small">受注一覧に戻る</Button>
            </Stack>

            <Grid container spacing={3}>
              {/* 左カラム: 注文情報 */}
              <Grid sx={{ xs: 12, md: 7 }}>
                <Typography variant="h6">注文情報</Typography>
                <Divider sx={{my:1}} />
                <Typography variant="body2">注文ID: {order.order_id}</Typography>
                <Typography variant="body2">注文日時: {new Date(order.created_at).toLocaleString('ja-JP')}</Typography>
                <Typography variant="body2">注文者: {order.user_username || 'ゲスト'}</Typography>
                <Typography variant="body2">支払い方法: {order.payment_method}</Typography>
                <Typography variant="body2">支払い状況: <Chip label={order.payment_status} size="small" /></Typography>

                <Typography variant="h6" sx={{mt:3}}>お届け先情報</Typography>
                <Divider sx={{my:1}} />
                <Typography variant="body2">{order.shipping_full_name} 様</Typography>
                <Typography variant="body2">〒{order.shipping_postal_code}</Typography>
                <Typography variant="body2">{order.shipping_prefecture}{order.shipping_city}{order.shipping_address1} {order.shipping_address2 || ''}</Typography>
                <Typography variant="body2">電話番号: {order.shipping_phone_number}</Typography>

                {order.notes && (<>
                  <Typography variant="h6" sx={{mt:3}}>備考</Typography>
                  <Divider sx={{my:1}} />
                  <Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{order.notes}</Typography>
                </>)}
              </Grid>

              {/* 右カラム: ステータス変更・商品リスト */}
              <Grid sx={{ xs: 12, md: 5 }}>
                  <Typography variant="h6">注文ステータス</Typography>
                  <Divider sx={{my:1}} />
                  <FormControl fullWidth size="small" sx={{mb:2}}>
                    <InputLabel id="order-status-select-label">現在のステータス</InputLabel>
                    <Select
                      labelId="order-status-select-label"
                      value={order.order_status}
                      label="現在のステータス"
                      onChange={(e) => handleStatusChange(e.target.value as Order['order_status'])}
                      disabled={isUpdatingStatus}
                    >
                      {ORDER_STATUS_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}
                          disabled={ // 完了やキャンセルからは変更不可など
                            order.order_status === 'completed' || order.order_status === 'cancelled' ||
                            (order.order_status === 'shipped' && opt.value !== 'completed' && opt.value !== 'shipped') // 発送後戻せないなど
                          }
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* 発送完了ボタン (ステータスが processing の場合など) */}
                  {(order.order_status === 'processing' || order.order_status === 'pending') && (
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<ShipIcon />}
                      onClick={handleMarkAsShipped}
                      disabled={isUpdatingStatus}
                      sx={{mb:3}}
                    >
                      {isUpdatingStatus ? <CircularProgress size={20} color="inherit"/> : '発送完了として通知'}
                    </Button>
                  )}

                  <Typography variant="h6" sx={{mt:2}}>注文商品</Typography>
                  <Divider sx={{my:1}} />
                  <List dense disablePadding>
                    {order.items.map(item => (
                      <ListItem key={item.id} disableGutters sx={{alignItems: 'flex-start'}}>
                        <ListItemText
                          primary={item.product_name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                単価: {parseInt(item.price_at_purchase).toLocaleString()}円
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ml:1}}>
                                数量: {item.quantity}
                              </Typography>
                            </>
                          }
                        />
                        <Typography variant="body2" fontWeight="medium" sx={{ml:1, whiteSpace: 'nowrap'}}>
                          {(parseFloat(item.price_at_purchase) * item.quantity).toLocaleString()} 円
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight="bold">商品合計</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">{parseFloat(order.total_amount).toLocaleString()} 円</Typography>
                  </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      }
    </>
  );
}


export default function ProducerOrderDetail() {
    return (
        <WithProducerAuth>
            <ProducerOrderDetailPageContent />
        </WithProducerAuth>
    );
}
