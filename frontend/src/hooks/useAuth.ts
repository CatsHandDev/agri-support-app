'use client'
import { useAtom, useSetAtom, getDefaultStore } from 'jotai';
import {
  accessTokenAtom,
  refreshTokenAtom,
  userAtom,
  authLoadingAtom,
  authErrorAtom,
  setTokensAtom,
  clearAuthDataAtom,
  isAuthenticatedAtom,
} from '@/atoms/authAtoms';
import { loadFavoritesAtom } from '@/atoms/favoriteAtoms';
import { login as apiLogin, getMe as apiGetMe, refreshToken as apiRefreshToken } from '@/services/authApi';
import { LoginCredentials } from '@/types/auth';
import { useCallback, useEffect, useRef } from 'react';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function useAuth() {
  const [accessToken] = useAtom(accessTokenAtom);
  const [refreshToken] = useAtom(refreshTokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useAtom(authLoadingAtom);
  const [error, setError] = useAtom(authErrorAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const setTokens = useSetAtom(setTokensAtom);
  const clearAuthData = useSetAtom(clearAuthDataAtom);
  const router = useRouter();

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await apiLogin(credentials);
      setTokens(tokens);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      const fetchedUser = await apiGetMe();
      setUser(fetchedUser);
      setIsLoading(false);
    } catch (err: any) {
      clearAuthData();
      setError(err.message || 'ログインに失敗しました。');
      setIsLoading(false);
      delete apiClient.defaults.headers.common['Authorization'];
      throw err;
    }
  }, [setIsLoading, setError, setTokens, setUser, clearAuthData]);

  const logout = useCallback(() => {
    console.log('[useAuth] Logging out...');
    clearAuthData();
    delete apiClient.defaults.headers.common['Authorization'];
    router.push('/');
  }, [clearAuthData, router]);

  const initializeAuth = useCallback(async () => {
    // ★ initializeAuth が呼ばれた時点での refreshToken を確認
    const currentRefreshToken = getDefaultStore().get(refreshTokenAtom);

    if (!currentRefreshToken) {
      console.log('[useAuth] No refresh token, setting loading to false.');
      setIsLoading(false); // トークンがなければ即ローディング終了
      return;
    }

    // ★ isLoading を true に設定 (リフレッシュ試行中はローディング)
    // このタイミングで setIsLoading を true にしないと、
    // 既に isLoading が false になっている場合に initializeAuth が再実行されない
    setIsLoading(true);

    try {
      const { access: newAccessToken } = await apiRefreshToken(currentRefreshToken);
      setTokens({ access: newAccessToken, refresh: currentRefreshToken });
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      const fetchedUser = await apiGetMe();
      setUser(fetchedUser);
    } catch (err) {
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setTokens, setUser, clearAuthData]);

  const isProducer = !!user?.is_producer;

  return {
    accessToken, refreshToken, user, isAuthenticated, isLoading, error, login, logout, initializeAuth, isProducer: isProducer,
  };
}

export function AuthInitializer() {
  const setIsLoading = useSetAtom(authLoadingAtom);
  const setTokens = useSetAtom(setTokensAtom);
  const setUser = useSetAtom(userAtom);
  const clearAuthData = useSetAtom(clearAuthDataAtom);
  const loadFavorites = useSetAtom(loadFavoritesAtom);
  const initialized = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      console.log('[AuthInitializer] Initializing auth and favorites...');
      const store = getDefaultStore(); // Jotai ストアを取得
      const currentRefreshToken = store.get(refreshTokenAtom); // localStorage から取得試行
      console.log('[AuthInitializer] Found refresh token:', !!currentRefreshToken);

      if (!currentRefreshToken) {
        console.log('[AuthInitializer] No refresh token, initialization done.');
        setIsLoading(false); // ローディング終了
        return; // リフレッシュトークンなければ終了
      }

      // リフレッシュ試行中はローディング
      setIsLoading(true);
      try {
        console.log('[AuthInitializer] Attempting token refresh...');
        const { access: newAccessToken } = await apiRefreshToken(currentRefreshToken);
        console.log('[AuthInitializer] Token refresh success.');
        store.set(setTokensAtom, { access: newAccessToken, refresh: currentRefreshToken }); // トークンを Atom にセット
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // Axios ヘッダーもセット

        try {
          console.log('[AuthInitializer] Fetching user data...');
          const fetchedUser = await apiGetMe(); // ユーザー情報取得
          store.set(userAtom, fetchedUser); // ユーザー Atom をセット
          console.log('[AuthInitializer] User data fetched.');

          console.log('[AuthInitializer] Loading favorites...');
          await store.set(loadFavoritesAtom); // ★ loadFavoritesAtom を実行 (非同期)
          console.log('[AuthInitializer] Favorites load initiated.');

        } catch (userError) {
          console.error('[AuthInitializer] Failed to fetch user after refresh. Clearing auth.', userError);
          store.set(clearAuthDataAtom); // ユーザー取得失敗ならクリア
          delete apiClient.defaults.headers.common['Authorization'];
        }

      } catch (refreshError) {
        console.error('[AuthInitializer] Token refresh failed. Clearing auth.', refreshError);
        store.set(clearAuthDataAtom); // リフレッシュ失敗ならクリア
        delete apiClient.defaults.headers.common['Authorization'];
      } finally {
        console.log('[AuthInitializer] Initialization process finished.');
        setIsLoading(false); // ローディング終了
      }
    };

    // クライアントサイドでのみ、かつ一度だけ実行
    if (typeof window !== 'undefined' && !initialized.current) {
      initialize();
      initialized.current = true;
    } else {
      // console.log('[AuthInitializer] Skipping initialization (already run or server side).');
      // サーバーサイド or 既に初期化済みの場合、ローディング状態を解除する必要がある
      // (ただし、初回レンダリング時は isLoading=true なので問題ないはず)
      // const store = getDefaultStore();
      // if (store.get(authLoadingAtom)) { store.set(authLoadingAtom, false); }
    }
  }, [setIsLoading, setTokens, setUser, clearAuthData, loadFavorites]);

  return null; // 何もレンダリングしない
}

// checkAuthAndRedirect 関数は必要に応じて残すか削除
// export async function checkAuthAndRedirect(router: AppRouterInstance): Promise<boolean> { ... }