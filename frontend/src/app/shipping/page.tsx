import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const metadata = { title: '配送について | 農業支援アプリ' };

export default function ShippingPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" mb={3}>
          配送について
        </Typography>
        <Typography variant="h6" gutterBottom>配送業者</Typography>
        <Typography paragraph color="text.secondary">ヤマト運輸、佐川急便、日本郵便（クール便対応可能な商品もございます）</Typography>

        <Typography variant="h6" gutterBottom mt={4}>送料</Typography>
        <Typography paragraph color="text.secondary">
          送料は配送地域、商品のサイズ・重量、クール便の有無によって変動します。
          ご注文手続き画面で、お届け先情報を入力後に正確な送料が表示されます。
          目安としては、関東近郊で常温便の場合XXX円～となります。
        </Typography>

        <Typography variant="h6" gutterBottom mt={4}>お届け日数</Typography>
        <Typography paragraph color="text.secondary">
          通常、ご注文確定後（銀行振込の場合はご入金確認後）、2～5営業日以内に発送いたします。
          収穫状況や天候により、発送が遅れる場合がございます。その場合は別途ご連絡いたします。
          お届け日時の指定も可能な範囲で承りますので、ご注文時の備考欄にご記入ください。
        </Typography>
        {/* 他の配送関連情報を追加 */}
      </Paper>
    </Container>
  );
}