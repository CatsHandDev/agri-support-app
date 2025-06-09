import React from 'react';
import { Container, Typography, Box, Paper, Link as MuiLink } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

export const metadata = { title: 'お問い合わせ | 農業支援アプリ' };

export default function ContactPage() {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" mb={3}>
          お問い合わせ
        </Typography>
        <Typography paragraph color="text.secondary">
          サービスに関するご質問、ご意見、ご要望などございましたら、お気軽にお問い合わせください。
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body1">
            メールでのお問い合わせ: <MuiLink href="mailto:support@example.com">support@example.com</MuiLink> (仮)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body1">
            お電話でのお問い合わせ: 0X0-XXXX-XXXX (受付時間: 平日 9:00～17:00) (仮)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{mt: 3}}>
            ※お問い合わせの内容によっては、回答にお時間をいただく場合がございます。あらかじめご了承ください。
        </Typography>
        {/* TODO: お問い合わせフォームを設置する場合 */}
      </Paper>
    </Container>
  );
}