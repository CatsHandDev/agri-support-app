import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const metadata = { title: '返品・交換について | 農業支援アプリ' };

export default function ReturnsPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" mb={3}>
          返品・交換について
        </Typography>
        <Typography variant="h6" gutterBottom>お客様都合による返品・交換</Typography>
        <Typography paragraph color="text.secondary">
          商品の特性上（生鮮食品・食品）、お客様のご都合による返品・交換は原則としてお受けできません。
          ご注文内容をよくご確認の上、お手続きください。
        </Typography>

        <Typography variant="h6" gutterBottom mt={4}>不良品・品違いの場合</Typography>
        <Typography paragraph color="text.secondary">
          商品の品質管理には万全を期しておりますが、万一お届けした商品に破損、傷み、品質不良、
          またはご注文と異なる商品が届いた場合は、大変お手数ですが商品到着後2日以内に、
          お問い合わせフォームまたはお電話にてご連絡ください。
          状況を確認させていただいた上で、速やかに交換または返金の手続きをさせていただきます。
          その際の送料は当店にて負担いたします。
        </Typography>
        <Typography paragraph color="text.secondary">
          ※商品の写真を添付していただけますと、よりスムーズな対応が可能です。
        </Typography>
        {/* 他の返品・交換関連情報を追加 */}
      </Paper>
    </Container>
  );
}