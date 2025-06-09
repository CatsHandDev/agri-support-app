// frontend/src/app/(producer)/orders-received/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProducerOrders, updateOrderStatusByProducer, markOrderAsShipped } from '@/services/orderApi';
import { Order } from '@/types/order';
import WithProducerAuth from '@/components/auth/withProducerAuth'; // 生産者ガード
import {
  Container, Typography, Box, Paper, CircularProgress, Alert,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Button, Pagination, Stack,
  Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Tooltip, Chip, Link as MuiLink
} from '@mui/material';
import { EditNote, LocalShipping, CheckCircle, LocalShipping as ShipIcon } from '@mui/icons-material';

const ITEMS_PER_PAGE = 10;
// OrderモデルのORDER_STATUS_CHOICESと合わせる
const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: '支払い待ち' },
    { value: 'processing', label: '処理中' },
    { value: 'shipped', label: '発送済み' },
    { value: 'completed', label: '完了' },
    { value: 'cancelled', label: 'キャンセル済み' },
];

function ProducerOrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(''); // ステータスフィルタ用
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({}); // 各注文のアクションローディング

  const router = useRouter();
  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  const loadOrders = useCallback(async (page = 1, currentStatusFilter = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {
        page: page,
        page_size: ITEMS_PER_PAGE,
        ordering: '-created_at',
        order_status: currentStatusFilter || undefined,
      };
      // getProducerOrders が PaginatedOrderResponse を返す
      const response = await getProducerOrders(page, ITEMS_PER_PAGE, filters);
      setOrders(response.results);   // ★ results をセット
      setTotalOrders(response.count); // ★ count をセット
      console.log('[loadOrders] ProducerOrders Success - Displaying:', response.results.length, 'Total:', response.count);
    } catch (err: any) { setOrders([]); setTotalOrders(0); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    loadOrders(currentPage, statusFilter);
  }, [currentPage, statusFilter, loadOrders]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };
  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setCurrentPage(1); // フィルタ変更時は1ページ目に戻る
    setStatusFilter(event.target.value);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['order_status']) => {
    if (actionLoading[orderId]) return;
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatusByProducer(orderId, newStatus);
      alert(`注文ID: ${orderId.substring(0,8)}... のステータスを「${ORDER_STATUS_OPTIONS.find(o=>o.value===newStatus)?.label}」に変更しました。`);
      // リストを再読み込みして表示を更新
      loadOrders(currentPage, statusFilter);
    } catch (error: any) {
      console.error("Failed to update order status", error);
      alert(`ステータス更新に失敗しました: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleMarkAsShipped = async (orderId: string) => {
    if (actionLoading[orderId]) return;
    // (任意) 確認ダイアログ
    if (!window.confirm(`注文ID: ${orderId.substring(0,8)}... を発送済みにしますか？注文者に通知メールが送信されます。`)) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await markOrderAsShipped(orderId);
      alert(`注文ID: ${orderId.substring(0,8)}... を発送済みにし、通知メールを送信しました（開発環境ではコンソール出力）。`);
      loadOrders(currentPage, statusFilter); // リストを再読み込み
    } catch (error: any) {
      console.error("Failed to mark order as shipped", error);
      alert(`発送処理に失敗しました: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  if (isLoading && orders.length === 0) { // 初回ロード中
    return <Container sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Container>;
  }
  if (error) { /* ... */ }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" mb={3}>
        受注管理
      </Typography>

      {/* フィルタ */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">注文ステータス</InputLabel>
          <Select labelId="status-filter-label" value={statusFilter} label="注文ステータス" onChange={handleStatusFilterChange}>
            <MenuItem value=""><em>すべて</em></MenuItem>
              {ORDER_STATUS_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
        {/* TODO: 注文者名や商品名での検索 */}
      </Paper>

      {isLoading && orders.length > 0 && <Box sx={{display:'flex', justifyContent:'center', my:2}}><CircularProgress size={25}/></Box>}

      {orders.length === 0 && !isLoading ? (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">該当する注文はありません。</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={1} variant="outlined">
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>注文ID</TableCell>
                <TableCell>注文日時</TableCell>
                <TableCell>注文者</TableCell> {/* 任意 */}
                <TableCell>合計金額</TableCell>
                <TableCell>支払い状況</TableCell>
                <TableCell>注文ステータス</TableCell>
                <TableCell align="center">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id} hover>
                  <TableCell>
                    <Tooltip title={order.order_id}>
                      <MuiLink component={Link} href={`/my-orders/received/${order.order_id}`} /* 生産者向け注文詳細 */ underline="hover">
                        {order.order_id.substring(0, 8)}...
                      </MuiLink>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleString('ja-JP')}</TableCell>
                  <TableCell>{order.user_username || 'ゲスト'}</TableCell>
                  <TableCell align="right">{parseFloat(order.total_amount).toLocaleString()} 円</TableCell>
                  <TableCell><Chip label={order.payment_status} size="small" /></TableCell>
                  <TableCell>
                  {/* ステータス変更用Select (またはボタン群) */}
                  <Select
                    value={order.order_status}
                    onChange={(e) => handleUpdateStatus(order.order_id, e.target.value as Order['order_status'])}
                    size="small"
                    variant="standard" // または outlined
                    disabled={actionLoading[order.order_id]}
                    sx={{ minWidth: 120 }}
                  >
                    {ORDER_STATUS_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}
                        // 完了やキャンセル済みは変更不可にするなど
                        // disabled={order.order_status === 'completed' || order.order_status === 'cancelled'}
                      >{opt.label}</MenuItem>
                    ))}
                  </Select>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} justifyContent="center"> {/* ボタンを横並びか縦並び */}
                      <Button variant="outlined" size="small" component={Link} href={`/my-orders/received/${order.order_id}`} startIcon={<EditNote />}>
                        詳細
                      </Button>
                      {(order.order_status === 'processing' || order.order_status === 'pending' /* 支払い済み処理中の場合 */) && (
                          <Button
                            variant="contained"
                            size="small"
                            color="success" // 緑色系
                            startIcon={<ShipIcon />}
                            onClick={() => handleMarkAsShipped(order.order_id)}
                            disabled={actionLoading[order.order_id]}
                          >
                            {actionLoading[order.order_id] ? <CircularProgress size={16} color="inherit"/> : '発送完了メール'}
                          </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Container>
  );
}

export default function ProducerOrders() {
  return (
    <WithProducerAuth> {/* 生産者ガード */}
      <ProducerOrdersPageContent />
    </WithProducerAuth>
  );
}

