import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

export const metadata = { title: '利用規約 | 農業支援アプリ' };

export default function TermsPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" mb={3}>
          利用規約
        </Typography>
        <Typography variant="h6" gutterBottom>第1条 (本規約の適用)</Typography>
        <Typography paragraph color="text.secondary">
          本規約は、[運営会社名]（以下「当社」といいます。）が提供する農業支援プラットフォームサービス
          「お野菜マルシェ・ハーベスト」（以下「本サービス」といいます。）の利用に関する条件を定めるものです...
        </Typography>

        <Typography variant="h6" gutterBottom mt={3}>第2条 (定義)</Typography>
        <Typography paragraph color="text.secondary">
          本規約において使用する以下の用語は、各々以下に定める意味を有するものとします...
        </Typography>
        {/* 利用規約の条文を記述 */}
        <Typography paragraph color="text.secondary" sx={{mt: 5}}>
          （以下略）
        </Typography>
      </Paper>
    </Container>
  );
}