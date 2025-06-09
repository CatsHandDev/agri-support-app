import apiClient from '@/lib/axios';
import { Profile } from '@/types/profile';
import axios from 'axios';

// フィルター用インターフェース
export interface ProfileApiFilters {
  search?: string;
  location_prefecture?: string;
  location_city?: string;
  ordering?: string;
  page?: number;
  // limit/offset はページネーションクラスによる
}

// ページネーションされたレスポンスの型
interface PaginatedProfileResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Profile[];
}

// 自分のプロフィールを取得する関数
export const getMyProfile = async (): Promise<Profile> => {
  // 認証トークンがヘッダーに付与されている必要あり
  try {
    const response = await apiClient.get<Profile>('/profiles/me/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error fetching profile:', error.response.data);
      throw error; // エラーを再スローしてコンポーネント側で処理
    } else {
      console.error('Unexpected error fetching profile:', error);
      throw new Error('プロフィールの取得中に予期せぬエラーが発生しました。');
    }
  }
};

// 自分のプロフィールを更新する関数
export const updateMyProfile = async (formData: FormData): Promise<Profile> => {
  // 認証トークンがヘッダーに付与されている必要あり
  try {
    // PATCH を使う (部分更新)
    const response = await apiClient.patch<Profile>('/profiles/me/', formData, {
      // headers: { 'Content-Type': 'multipart/form-data' }, // FormData なら不要なことが多い
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error updating profile:', error.response.data);
      throw error; // エラーを再スロー (バリデーションエラーなど)
    } else {
      console.error('Unexpected error updating profile:', error);
      throw new Error('プロフィールの更新中に予期せぬエラーが発生しました。');
    }
  }
};

// 新規または注目の生産者プロフィール一覧を取得する関数
export const getLatestProducers = async (limit: number = 4): Promise<Profile[]> => {
  console.log(`[getLatestProducers] Fetching latest ${limit} producer profiles from API`);
  try {
    // /api/profiles/ を呼び出す (デフォルトで新しい順のはず)
    const response = await apiClient.get<Profile[]>('/profiles/', {
      params: {
        limit: limit, // 件数制限 (DRFのPagination未使用の場合、別途limitパラメータをViewSetで処理する必要あり)
        // Pagination使用の場合は limit より page_size や page を使う
      }
    });
    // Pagination を使っている場合のレスポンス形式に合わせて調整が必要
    // 例: return response.data.results ?? response.data;
    // Pagination 未使用で limit パラメータを自前で処理する場合や、
    // デフォルトで件数が少ない場合は response.data で OK なことが多い
    return response.data;
  } catch (error) {
    console.error('Error fetching latest producers:', error);
    return [];
  }
};

// ユーザー名で生産者プロフィールを取得する関数
export const getProducerProfileByUsername = async (username: string): Promise<Profile | null> => {
  console.log(`[getProducerProfileByUsername API] Fetching profile for: ${username}`);
  try {
    // /api/profiles/{username}/ を呼び出す
    const response = await apiClient.get<Profile>(`/profiles/${username}/`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`Producer profile not found for username: ${username}`);
      return null; // 404 の場合は null を返す
    }
  console.error(`Error fetching producer profile ${username}:`, error);
  throw error; // その他のエラーはスローする
  }
};

// 生産者リストを取得する関数 (ページネーション・フィルター対応)
export const getProducers = async (filters?: ProfileApiFilters): Promise<PaginatedProfileResponse> => {
  console.log('[getProducers API] Fetching producers with filters:', filters);
  try {
    const response = await apiClient.get<PaginatedProfileResponse>('/profiles/', {
      params: filters // フィルターオブジェクトをそのまま渡す
    });
    return response.data; // { count, next, previous, results } を返す
  } catch (error) {
    console.error('Error fetching producers:', error);
    return { count: 0, next: null, previous: null, results: [] }; // エラー時は空を返す
  }
};