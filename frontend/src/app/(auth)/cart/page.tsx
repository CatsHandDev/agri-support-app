// frontend/src/app/(authenticated)/cart/page.tsx
'use client';

import React, { ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart'; // カートフック
import WithAuth from '@/components/auth/WithAuth'; // 認証ガード
import {
  Container, Typography, Box, Grid, Paper, IconButton, Button, TextField, ListItem, Tooltip, Divider, List , Stack, Alert
} from '@mui/material';
import { DeleteOutline, AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material'; // アイコン

function CartPageContent() {
  const {
    cartItems,
    totalPrice,
    totalItems,
    removeFromCart,
    updateItemQuantity,
    clearCart // カートを空にする機能 (任意)
  } = useCart();

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  const handleQuantityChange = (productId: number, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(0, currentQuantity + change); // 0未満にならないように
    if (newQuantity === 0) {
      // 数量が0になったら削除確認 (任意)
      if (window.confirm('商品をカートから削除しますか？')) {
        removeFromCart(productId);
      }
    } else {
      updateItemQuantity(productId, newQuantity);
    }
  };

   const handleQuantityInputChange = (productId: number, event: React.ChangeEvent<HTMLInputElement>) => {
      const newQuantity = parseInt(event.target.value, 10);
       if (!isNaN(newQuantity)) { // 数値であることを確認
            if (newQuantity <= 0) {
                 if (window.confirm('商品をカートから削除しますか？')) {
                     removeFromCart(productId);
                 } else {
                     // 削除キャンセル時は元の数量に戻す or 1にする
                     // (元の数量を state で管理する必要があるかも)
                     updateItemQuantity(productId, 1); // 例: 1に戻す
                 }
            } else {
                updateItemQuantity(productId, newQuantity);
            }
       }
   };


  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" mb={4}>
        ショッピングカート
      </Typography>

      {cartItems.length === 0 ? (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            カートは空です。
          </Typography>
          <Button component={Link} href="/products" variant="contained" sx={{ mt: 3 }}>
            お買い物を続ける
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {/* カートアイテムリスト */}
          <Grid sx={{ xs: 12, md: 8 }}>
            <Paper elevation={0} variant="outlined">
              <List sx={{ p: 0 }}> {/* Listコンポーネントを使うと区切り線などを入れやすい */}
                {cartItems.map((item, index) => {
                  const product = item.product;
                  const imageUrl = product.image ? `${mediaBaseUrl}${product.image}` : null;
                  const itemSubtotal = parseFloat(product.price) * item.quantity;

                  return (
                    <React.Fragment key={product.id}>
                      <ListItem sx={{ py: 3, px: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}> {/* pxで左右パディング */}
                        {/* 商品画像 */}
                         <Box sx={{ width: { xs: '80px', sm: '100px' }, height: { xs: '80px', sm: '100px' }, flexShrink: 0, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100' }}>
                             {imageUrl ? (
                                <Image src={imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} /* unoptimized={true} */ />
                             ) : (
                                <Box sx={{ /* 画像なし表示 */ }}>画像なし</Box>
                             )}
                         </Box>

                         {/* 商品名・生産者 */}
                         <Box sx={{ flexGrow: 1, minWidth: '150px' }}>
                             <Typography variant="subtitle1" fontWeight="medium" component={Link} href={`/products/${product.id}`} sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline'} }}>
                                 {product.name}
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                                 {product.producer_username}
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                                 単価: {parseInt(product.price, 10).toLocaleString()} 円
                             </Typography>
                         </Box>

                         {/* 数量変更 */}
                         <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '120px' }}>
                              <IconButton onClick={() => handleQuantityChange(product.id, item.quantity, -1)} size="small" disabled={item.quantity <= 1 && false /* 0の時削除なら常に有効 */}>
                                 <RemoveCircleOutline fontSize="small" />
                              </IconButton>
                              {/* 数量入力 */}
                              <TextField
                                  type="number"
                                  size="small"
                                  value={item.quantity}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleQuantityInputChange(product.id, e)}
                                  inputProps={{ min: 1, style: { textAlign: 'center', width: '40px' } }}
                                  sx={{ mx: 0.5 }}
                              />
                              <IconButton onClick={() => handleQuantityChange(product.id, item.quantity, 1)} size="small">
                                 <AddCircleOutline fontSize="small" />
                              </IconButton>
                         </Box>

                         {/* 小計 */}
                         <Box sx={{ minWidth: '100px', textAlign: { xs: 'right', sm: 'center' }, fontWeight: 'medium' }}>
                              <Typography variant="body1" fontWeight="medium">
                                 {itemSubtotal.toLocaleString()} 円
                              </Typography>
                         </Box>

                         {/* 削除ボタン */}
                         <Box sx={{ textAlign: 'right', ml: { xs: 'auto', sm: 0 } }}>
                             <Tooltip title="カートから削除">
                                 <IconButton onClick={() => removeFromCart(product.id)} color="error" size="small">
                                     <DeleteOutline />
                                 </IconButton>
                             </Tooltip>
                         </Box>
                      </ListItem>
                      {/* 最後のアイテム以外に区切り線 */}
                      {index < cartItems.length - 1 && <Divider component="li" variant="inset" />}
                    </React.Fragment>
                  );
                })}
              </List>
               {/* カートを空にするボタン (任意) */}
               <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                 <Button variant="outlined" size="small" color="error" onClick={() => { if (window.confirm('カートを空にしますか？')) clearCart(); }}>カートを空にする</Button>
               </Box>
            </Paper>
          </Grid>

          {/* 合計・注文エリア */}
          <Grid sx={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: '80px' }}> {/* スクロール追従 (任意) */}
              <Typography variant="h6" gutterBottom>ご注文内容</Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">商品小計 ({totalItems} 点)</Typography>
                  <Typography>{totalPrice.toLocaleString()} 円</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">送料</Typography>
                  <Typography>別途計算</Typography> {/* TODO: 送料計算 */}
                </Stack>
                {/* TODO: クーポン、ポイントなど */}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">合計金額</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.dark">
                    {totalPrice.toLocaleString()} 円 <Typography variant="caption" component="span">(税込・送料別)</Typography>
                  </Typography>
                </Stack>
              </Stack>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={totalItems === 0}
                component={Link}
                href="/checkout"
              >
                注文手続きへ進む
              </Button>
              <Button component={Link} href="/products" variant="text" fullWidth sx={{ mt: 2 }}>
                お買い物を続ける
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

// ページ全体を認証ガードでラップ
export default function Cart() {
  return (
    <WithAuth>
      <CartPageContent />
    </WithAuth>
  );
}
