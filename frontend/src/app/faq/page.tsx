import React from 'react';
import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const metadata = { title: 'よくある質問 | 農業支援アプリ' };

export default function FaqPage() {
  const faqs = [
    { q: '送料はいくらですか？', a: '配送地域や商品のサイズによって異なります。詳細は配送についてページをご確認ください。' },
    { q: '返品はできますか？', a: '生鮮食品のため、お客様都合による返品・交換は原則としてお受けできません。商品の品質には万全を期しておりますが、万一不良品が届いた場合は、到着後2日以内にご連絡ください。' },
    { q: '支払い方法は何がありますか？', a: 'クレジットカード、銀行振込（準備中）をご利用いただけます。' },
    // 他のFAQを追加
  ];

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" textAlign="center" mb={5}>
        よくあるご質問 (FAQ)
      </Typography>
      <Box>
        {faqs.map((faq, index) => (
          <Accordion key={index} sx={{ mb: 1.5, '&:before': { display: 'none' } /* 区切り線非表示 */, boxShadow: 1, borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`faq-content-${index}`} id={`faq-header-${index}`}>
              <Typography fontWeight="medium">{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}