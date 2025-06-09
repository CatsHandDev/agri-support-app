// frontend/src/app/(authenticated)/my-orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // useRouter もインポート
import { getMyOrders } from '@/services/orderApi';
import { Order } from '@/types/order';
import WithAuth from '@/components/auth/WithAuth'; // 認証ガード
import {
  Container, Typography, Box, Paper, CircularProgress, Alert,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Button, Pagination, Stack,
  Chip
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

const ITEMS_PER_PAGE = 10; // 1ページあたりの表示件数

function MyOrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  // --- データ取得関数 ---
  const loadOrders = useCallback(async (pageToLoad  = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMyOrders(pageToLoad, ITEMS_PER_PAGE);
      setOrders(response.results);   // ★ results をセット
      setTotalOrders(response.count); // ★ count をセット
      console.log('[loadOrders] MyOrders Success - Displaying:', response.results.length, 'Total:', response.count);
    } catch (err: any) {
      console.error("Failed to fetch orders", err);
      setError(err.message || "注文履歴の読み込みに失敗しました。");
      setOrders([]);
      setTotalOrders(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 初回ロード & ページ変更時のロード ---
  useEffect(() => {
    loadOrders(currentPage);
  }, [currentPage, loadOrders]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }
  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/my-orders/${orderId}`); // ★ 注文詳細ページへ遷移
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" mb={4}>
        注文履歴
      </Typography>

      {!orders || orders.length === 0 ? (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">注文履歴はありません。</Typography>
          <Button component={Link} href="/products" variant="contained" sx={{ mt: 3 }}>
            お買い物を始める
          </Button>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} elevation={1} variant="outlined">
            <Table sx={{ minWidth: 650 }} aria-label="注文履歴テーブル">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>注文ID</TableCell>
                  <TableCell>注文日時</TableCell>
                  <TableCell align="right">合計金額 (税込)</TableCell>
                  <TableCell>支払い状況</TableCell>
                  <TableCell>配送状況</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.order_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {order.order_id.substring(0, 8)}... {/* 短縮表示 */}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString('ja-JP')}</TableCell>
                    <TableCell align="right">{parseFloat(order.total_amount).toLocaleString()} 円</TableCell>
                    <TableCell>
                        <Chip label={order.payment_status} /* TODO: statusに応じて色分け */ size="small" />
                    </TableCell>
                    <TableCell>
                        <Chip label={order.order_status} /* TODO: statusに応じて色分け */ size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewOrder(order.order_id)} // ★ order_id を渡す
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default function MyOrders() {
  return (
    <WithAuth> {/* ログイン必須 */}
      <MyOrdersPageContent />
    </WithAuth>
  );
}
