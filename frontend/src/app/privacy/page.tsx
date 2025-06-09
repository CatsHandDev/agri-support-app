// frontend/src/app/privacy/page.tsx
import React from 'react';
import { Container, Typography, Box, Paper, List, ListItem, ListItemText } from '@mui/material';

export const metadata = {
  title: 'プライバシーポリシー | 農業支援アプリ',
  description: '農業支援アプリ「お野菜マルシェ・ハーベスト」の個人情報保護方針について説明します。',
};

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" textAlign="center" mb={5}>
          プライバシーポリシー
        </Typography>

        <Typography variant="body1" paragraph color="text.secondary">
          株式会社 AgriConnect（以下「当社」といいます。）は、当社が提供するサービス「お野菜マルシェ・ハーベスト」（以下「本サービス」といいます。）における、ユーザーの個人情報を含む利用者情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
        </Typography>

        <Box sx={{ my: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
            第1条（収集する利用者情報及び収集方法）
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            本ポリシーにおいて、「利用者情報」とは、ユーザーの識別に係る情報、通信サービス上の行動履歴、その他ユーザーまたはユーザーの端末に関連して生成または蓄積された情報であって、本ポリシーに基づき当社が収集するものを意味するものとします。
            本サービスにおいて当社が収集する利用者情報は、その収集方法に応じて、以下のようなものとなります。
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText
                primary="ユーザーからご提供いただく情報"
                secondary="氏名、メールアドレス、電話番号、住所、生年月日、性別、クレジットカード情報、銀行口座情報、その他当社が定める入力フォームにユーザーが入力する情報"
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText
                primary="ユーザーが本サービスの利用において、他のサービスと連携を許可することにより、当該他のサービスからご提供いただく情報"
                secondary="当該外部サービスでユーザーが利用するID、その他当該外部サービスのプライバシー設定によりユーザーが連携先に開示を認めた情報"
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText
                primary="ユーザーが本サービスを利用するにあたって、当社が収集する情報"
                secondary="Cookie及びこれに類する技術、IPアドレス、端末の種類、端末識別子、ブラウザの種類、参照元、アクセス日時、その他本サービスの利用状況に関する情報"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ my: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
            第2条（利用目的）
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            本サービスのサービス提供にかかわる利用者情報の具体的な利用目的は以下のとおりです。
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText primary="本サービスの提供、維持、保護及び改善のため"/>
            </ListItem>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText primary="本サービスに関するご案内、お問い合わせ等への対応のため"/>
            </ListItem>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText primary="本サービスに関する当社の規約、ポリシー等（以下「規約等」といいます。）に違反する行為に対する対応のため"/>
            </ListItem>
            <ListItem sx={{ display: 'list-item', listStyleType: 'decimal', pl:1 }}>
              <ListItemText primary="本サービスに関する規約等の変更などを通知するため"/>
            </ListItem>
            {/* 他の利用目的を追加 */}
          </List>
        </Box>

        {/*
        --- 他の条項の例 ---
        <Box sx={{ my: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
            第3条（第三者提供）
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            当社は、利用者情報のうち、個人情報については、あらかじめユーザーの同意を得ないで、第三者（日本国外にある者を含みます。）に提供しません。但し、次に掲げる場合はこの限りではありません...
          </Typography>
        </Box>

        <Box sx={{ my: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
            第X条（プライバシーポリシーの変更手続）
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            当社は、必要に応じて、本ポリシーを変更します。但し、法令上ユーザーの同意が必要となるような本ポリシーの変更を行う場合、変更後の本ポリシーは、当社所定の方法で変更に同意したユーザーに対してのみ適用されるものとします...
          </Typography>
        </Box>
        */}

        <Typography paragraph color="text.secondary" sx={{mt: 5}}>
          （以下略）
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mt: 3}}>
          制定日: 2025年X月X日
        </Typography>
      </Paper>
    </Container>
  );
}