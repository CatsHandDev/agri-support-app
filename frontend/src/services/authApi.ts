import apiClient from '@/lib/axios';
import { User } from '@/types/user';
import { LoginCredentials, TokenPair, RegisterPayload } from '@/types/auth';
import axios from 'axios';

// ログイン関数
export const login = async (credentials: LoginCredentials): Promise<TokenPair> => {
  console.log('[login API] Sending credentials:', { ...credentials, password: '***' }); // データ確認

  try {
    // `/accounts/token/` は baseURL ('/api') からの相対パス
    const response = await apiClient.post<TokenPair>('/accounts/token/', credentials);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('[login API] Login failed response data:', error.response.data);
      throw new Error(error.response.data.detail || 'ログインに失敗しました。');
    } else {
      console.error('Login failed:', error);
      throw new Error('ログイン中に予期せぬエラーが発生しました。');
    }
  }
};

// ログインユーザー情報取得関数
export const getMe = async (): Promise<User> => {
  try {
    // このリクエストには認証トークンが必要 (axios インターセプターで付与される想定)
    const response = await apiClient.get<User>('/accounts/me/');
    return response.data;
  } catch (error) {
     if (axios.isAxiosError(error) && error.response) {
      console.error('Failed to fetch user info:', error.response.data);
      throw new Error(error.response.data.detail || 'ユーザー情報の取得に失敗しました。');
    } else {
      console.error('Failed to fetch user info:', error);
      throw new Error('ユーザー情報取得中に予期せぬエラーが発生しました。');
    }
  }
};

// (参考) トークンリフレッシュ関数
export const refreshToken = async (refresh: string): Promise<{ access: string }> => {
  try {
    const response = await apiClient.post<{ access: string }>('/accounts/token/refresh/', { refresh });
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('トークンのリフレッシュに失敗しました。');
    // ここでリフレッシュ失敗時のログアウト処理などをトリガーしても良い
  }
};

// 新規ユーザー登録関数
export const register = async (payload: RegisterPayload): Promise<User> => {
  // ↑↑↑ 登録に必要な情報を受け取る (型は types/auth.ts で定義)
  // ↓↓↓ 成功時にユーザー情報を返す想定 (API 仕様による)
  console.log('[register API] Sending registration data:', { ...payload, password: '***', password2: '***' }); // パスワードはログに出さない
  try {
    // `/accounts/register/` は baseURL ('/api') からの相対パス
    // バックエンドの RegisterSerializer の fields に合わせる
    const response = await apiClient.post<User>('/accounts/register/', payload);
    console.log('[register API] Registration successful:', response.data);

    return response.data; // 登録されたユーザー情報を返す (API仕様による)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('[register API] Registration failed:', error.response.data);
      // バックエンドからのバリデーションエラー (例: { username: ["このユーザー名は既に使用されています。"] }) をそのまま投げる
      throw error; // エラーオブジェクト全体を投げてフォーム側で処理
    } else {
      console.error('[register API] Unexpected error during registration:', error);
      throw new Error('登録中に予期せぬエラーが発生しました。');
    }
  }
};

// ユーザー情報更新用ペイロード型
interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
}

// 自分のユーザー情報を更新する関数
export const updateUserMe = async (payload: UserUpdatePayload): Promise<User> => {
  console.log('[updateUserMe API] Updating user info with:', payload);
  try {
    // /api/accounts/me/ に PATCH リクエスト
    const response = await apiClient.patch<User>('/accounts/me/', payload);
    console.log('[updateUserMe API] User info updated successfully:', response.data);
    return response.data; // 更新後のユーザー情報を返す
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('[updateUserMe API] Update failed:', error.response.data);
      throw error; // エラーオブジェクトを再スロー
    } else {
      console.error('[updateUserMe API] Unexpected error during update:', error);
      throw new Error('ユーザー情報の更新中に予期せぬエラーが発生しました。');
    }
  }
};