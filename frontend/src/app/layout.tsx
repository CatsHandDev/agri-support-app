import './globals.css';
import styles from './page.module.scss';
import { AuthInitializer } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/Footer';
import { Box } from '@mui/material';

export const metadata = {
  title: 'お野菜マルシェ ハーベスト',
  description: '生産者と実需者を繋ぐデジタルマルシェ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" style={{ height: '100%' }}>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <AuthInitializer />
        <Header />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <Footer />
      </body>
    </html>
  )
}