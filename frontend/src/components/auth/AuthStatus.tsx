'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import styles from './AuthStatus.module.scss';

export default function AuthStatus() {
  const { user, isAuthenticated, isLoading, logout, isProducer } = useAuth();

  if (isLoading) {
    return <span className={styles.loading}>読み込み中...</span>;
  }

  return (
    <div className={styles.authContainer}>
      {isAuthenticated && user ? (
        <>
          <span className={styles.welcomeMessage}>
            こんにちは、{user.username} さん
          </span>
          <Link href='/my-products'>マイページ</Link>
          <button onClick={logout} className={styles.logoutButton}>
            ログアウト
          </button>
        </>
      ) : (
        <>
          {/* ★未認証時のログ */}
          <div className={styles.authButtons}>
            <Link href="/register" className={styles.registerButton}>新規登録</Link>
            <Link href="/login" className={styles.loginButton}>ログイン</Link>
          </div>
        </>
      )}
    </div>
  );
}