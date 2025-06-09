// frontend/src/components/producers/ProducerCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Profile } from '@/types/profile'; // Profile 型をインポート
import {
  Card, CardActionArea, CardContent, Typography, Box, Avatar, Chip, Stack
} from '@mui/material';

interface ProducerCardProps {
  profile: Profile;
  mediaBaseUrl: string;
}

export default function ProducerCard({ profile, mediaBaseUrl }: ProducerCardProps) {
  const imageUrl = profile.image ? `${mediaBaseUrl}${profile.image}` : null;
  const producerName = profile.farm_name || profile.username; // 農園名があればそれを、なければユーザー名
  const location = [profile.location_prefecture, profile.location_city].filter(Boolean).join(' '); // 都道府県と市区町村を結合

  // TODO: 生産者の主なカテゴリや特徴を取得するロジック (Profile モデルにフィールド追加 or 商品から集計など)
  const mainCategory = profile.category || '野菜・果物'; // ダミー

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), transform 0.3s cubic-bezier(.25,.8,.25,1)',
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-3px)',
      },
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* カード全体をクリック可能にし、生産者詳細ページへリンク */}
      <CardActionArea component={Link} href={`/producers/${profile.username}`} /* 生産者詳細ページのパス */ sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', p: 3 /* カード内パディング */ }}>
         {/* プロフィール画像 (Avatar) */}
         <Avatar
            src={imageUrl ?? undefined}
            alt={producerName}
            sx={{
                width: 96, height: 96, mb: 2, // 下にマージン
                bgcolor: 'primary.light', // 画像ない場合の背景色
                fontSize: '2rem' // 画像ない場合のイニシャル用
            }}
        >
            {/* 画像がない場合は農園名の頭文字などを表示 (任意) */}
            {!imageUrl && producerName ? producerName.charAt(0).toUpperCase() : null}
        </Avatar>

        {/* 農園名 / ユーザー名 */}
        <Typography variant="h6" fontWeight="bold" gutterBottom align="center" noWrap title={producerName}>
          {producerName}
        </Typography>

        {/* 所在地 */}
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
          {location || '未設定'}
        </Typography>

        {/* 特徴やカテゴリ (Chip) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5, mt: 'auto' /* 下寄せ */ }}>
          <Chip label={mainCategory} size="small" variant="outlined" sx={{ bgcolor: '#e8f5e9', borderColor: 'primary.light' }} />
          {/* 他にも特徴があれば Chip を追加 */}
          {/* <Chip label="有機栽培" size="small" variant="outlined" /> */}
        </Box>
      </CardActionArea>
    </Card>
  );
}