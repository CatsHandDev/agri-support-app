// frontend/src/components/layout/Footer.tsx
import React from 'react';
import { Container, Typography, Box, Grid, Link as MuiLink, Divider } from '@mui/material';
import Link from 'next/link'; // Next.js の Link

const footerLinks = [
  { text: 'よくある質問', href: '/faq' },
  { text: '配送について', href: '/shipping' },
  { text: '返品・交換について', href: '/returns' },
  { text: 'お問い合わせ', href: '/contact' },
  { text: '利用規約', href: '/terms' },
  { text: 'プライバシーポリシー', href: '/privacy' },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#16a34a', color: 'white', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid sx={{ xs: 12, sm: 6, md: 3}}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              お野菜マルシェ・ハーベスト
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              生産者と消費者を繋ぐ農産物マーケットプレイス。
            </Typography>
            {/* SNSリンクなど (任意) */}
          </Grid>
          <Grid sx={{ xs: 6, sm: 3, md: 2}}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">会社情報</Typography>
            <Stack spacing={0.5}>
                <MuiLink component={Link} href="/about" color="inherit" underline="hover">私たちについて</MuiLink>
                {/* 他の会社情報リンク */}
            </Stack>
          </Grid>
          <Grid sx={{ xs: 6, sm: 3, md: 2}}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">サポート</Typography>
            <Stack spacing={0.5}>
              {footerLinks.map((link) => (
                <MuiLink key={link.text} component={Link} href={link.href} color="inherit" underline="hover" sx={{ display: 'block' }}>
                  {link.text}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
          {/* 必要なら他のリンク列を追加 */}
        </Grid>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 4 }} />
        <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} お野菜マルシェ・ハーベスト. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

// Stack のインポートを追加
import { Stack } from '@mui/material';