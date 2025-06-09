// frontend/src/app/about/page.tsx
import React from 'react';
import { Container, Typography, Box, Paper, Grid, Avatar } from '@mui/material';
import Image from 'next/image'; // 必要であれば Next Image も使用
import Link from 'next/link'; // 内部リンク用
import MuiLink from '@mui/material/Link';
import { Divider } from '@mui/material';

const appeal = [
  { title: '産地直送', description: '全国の生産者から直接お届け。新鮮さが違います。'},
  { title: '顔が見える安心感', description: '生産者のプロフィールやこだわりを知って購入できます。'},
  { title: '適正価格', description: '中間マージンを削減し、生産者にも消費者にも嬉しい価格を実現。'},
]

export const metadata = {
  title: '私たちについて | 農業支援アプリ',
  description: '農業支援アプリ「お野菜マルシェ・ハーベスト」のミッション、特徴、運営会社についてご紹介します。',
};

export default function AboutPage() {
  // このページは静的な内容が主なので 'use client' は不要 (サーバーコンポーネント)
  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000'; // 画像を使う場合

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}> {/* 上下マージン */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}> {/* パディング */}

        {/* ページタイトル */}
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" textAlign="center" mb={4}>
          私たちについて
        </Typography>

        {/* --- ミッションセクション --- */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" color="primary.dark" /* #16a34a */ fontWeight="bold" gutterBottom>
            ミッション
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            「新鮮」と「安心」を、食卓へ。生産者と消費者の架け橋に。
          </Typography>
          <Typography variant="body1" paragraph>
            私たちは、テクノロジーを活用することで、生産者が丹精込めて育てた農産物の価値が正当に評価され、消費者が新鮮で安全な食材を手軽に手に入れられる社会を目指しています。
            中間コストを削減し、透明性の高い情報を提供することで、持続可能な農業と豊かな食生活の両立に貢献します。
          </Typography>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* --- アプリの特徴セクション --- */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" color="primary.dark" fontWeight="bold" gutterBottom>
            アプリの特徴
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',         // スマホ（0px〜）
                sm: 'repeat(2, 1fr)', // タブレット（600px〜）
                md: 'repeat(3, 1fr)', // PC（900px〜）
              },
              gap: 2,
            }}
          >
            {appeal.map((prev: {title: string, description: string}, index: number) => (
              <Paper
                key={index}
                sx={{
                  width: '100%',
                  height: 100,
                  padding: '8px',
                  textAlign: 'center',
                  lineHeight: '100px',
                }}
              >
                <Typography variant="h6" component="h3" gutterBottom fontWeight="medium">
                  {prev.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {prev.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* --- 運営情報セクション (ダミー) --- */}
        <Box>
          <Typography variant="h4" component="h2" color="primary.dark" fontWeight="bold" gutterBottom>
            運営会社
          </Typography>
          <Typography variant="body1" paragraph>
            株式会社 AC-Connect
          </Typography>
          <Typography variant="body1" paragraph>
            所在地: 東京都千代田区1-1
          </Typography>
          <Typography variant="body1" paragraph>
            代表者: 久留米　忠
          </Typography>
          <Typography variant="body1">
            お問い合わせ: <MuiLink component={Link} href="/contact">お問い合わせフォーム</MuiLink> {/* /contact ページも必要 */}
          </Typography>
           {/* 必要なら代表者名、設立年月日などを追加 */}
        </Box>

      </Paper>
    </Container>
  );
}

