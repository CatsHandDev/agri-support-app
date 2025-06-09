import apiClient from '@/lib/axios'; // 作成したaxiosインスタンスをインポート
import { Product } from '@/types/product'; // 商品の型定義 (後で作成)
import axios from 'axios';

// フィルター条件の型 (バックエンドの ProductFilter に合わせる)
export interface ProductApiFilters {
  search?: string;         // キーワード検索 (ProductViewSet の search_fields と連動)
  category?: string;       // カテゴリ (完全一致 or 部分一致など)
  min_price?: number | string; // 価格下限
  max_price?: number | string; // 価格上限
  cultivation_method?: string[]; // 栽培方法 (複数選択の場合は配列)
  ordering?: string;       // 並び順 (例: '-created_at', 'price')
  limit?: number;
  offset?: number;
  page?: number;
  status?: Product['status']; // 常に 'active' を渡す
  producer_username?: string;
}

// ★ API レスポンスの型 (DRF Pagination を使う場合) ★
interface PaginatedProductResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// 商品一覧を取得する関数 (フィルター機能付き)
export const getProducts = async (filters?: ProductApiFilters): Promise<Product[]> => {
  console.log('[getProducts API] Fetching with filters:', filters);
  try {
    const params: ProductApiFilters = {
      status: 'active', // 販売中の商品のみは固定
      ...filters,
    };
    // 不要なパラメータを削除 (API仕様に合わせて調整)
    if (!params.search) delete params.search;
    if (!params.category) delete params.category;
    if (!params.min_price || Number(params.min_price) <= 0) delete params.min_price;
    if (!params.max_price || Number(params.max_price) >= 10000) delete params.max_price;
    if (!params.cultivation_method || params.cultivation_method.length === 0) delete params.cultivation_method;
    if (params.ordering === '-created_at' || !params.ordering) delete params.ordering; // デフォルトなら送らない
    // APIがページネーションをサポートしない場合、page, limit は削除
    delete params.page;
    delete params.limit;


    // ★ API が Product[] を直接返すと期待
    const response = await apiClient.get<Product[]>('/products/', { params });
    console.log('[getProducts API] Raw response.data (expecting Product[]):', response.data);

    // ★ APIが配列を返していることを確認し、そのまま返す
    if (Array.isArray(response.data)) {
        return response.data;
    } else {
      // 万が一、予期しない形式だったこに来ないはず)
      console.error("[getProducts API] Response data is not an array as expected. Got:", response.data);
      return []; // エラー時は空配列場合 (通常はこ
    }
  } catch (error) {
    console.error('Error fetching products with filters:', error);
    return []; // エラー時も空配列
  }
};

// 商品詳細を取得する関数
export const getProductById = async (id: string | number): Promise<Product | null> => {
  try {
    const response = await apiClient.get(`/products/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
};

// 商品を作成する関数
export const createProduct = async (formData: FormData): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>('/products/', formData, {
      headers: {
        // 問題があれば削除
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Product created successfully:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error creating product:', {
        message: error.message,
        status: error.response.status,
        data: error.response.data, // バックエンドからのバリデーションエラーなど
      });
      throw error;
    } else {
      console.error('Unexpected error creating product:', error);
      throw new Error('商品の作成中に予期せぬエラーが発生しました。');
    }
  }
};

// 商品情報を更新する関数 (編集用 - PATCH)
export const updateProduct = async (id: number | string, formData: FormData): Promise<Product> => {
  try {
    const response = await apiClient.patch<Product>(`/products/${id}/`, formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Error updating product ${id}:`, error.response.data);
      throw error;
    } else {
      console.error(`Unexpected error updating product ${id}:`, error);
      throw new Error('商品の更新中に予期せぬエラーが発生しました。');
    }
  }
};

// 商品を削除する関数
export const deleteProduct = async (id: number | string): Promise<void> => {
  try {
    await apiClient.delete(`/products/${id}/`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Error deleting product ${id}:`, error.response.data);
      throw error;
    } else {
      console.error(`Unexpected error deleting product ${id}:`, error);
      throw new Error('商品の削除中に予期せぬエラーが発生しました。');
    }
  }
};

// 商品のステータスを変更する関数
export const updateProductStatus = async (id: number | string, newStatus: Product['status']): Promise<Product> => {
  try {
    // カスタムアクションのエンドポイントを呼び出す
    const response = await apiClient.post<Product>(`/products/${id}/change-status/`, { status: newStatus });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Error changing status for product ${id}:`, error.response.data);
      throw error;
    } else {
      console.error(`Unexpected error changing status for product ${id}:`, error);
      throw new Error('ステータスの変更中に予期せぬエラーが発生しました。');
    }
  }
};

// 自分の商品一覧を取得する関数 (全ステータス)
export const getMyProducts = async (): Promise<Product[]> => {
  // 認証トークンが必要
  try {
    // ?owner=me パラメータを追加
    const response = await apiClient.get<Product[]>('/products/?owner=me');
    return response.data;
  } catch (error) {
    console.error('Error fetching my products:', error);
    // エラー処理
    return [];
  }
};

// 新着商品を取得する関数 (上位 N 件)
export const getNewProducts = async (limit: number = 5): Promise<Product[]> => {
  console.log(`[getNewProducts] Fetching latest ${limit} products from API`);
  try {
    // ordering=-created_at で新しい順、limit で件数指定
    const response = await apiClient.get<Product[]>('/products/', {
      params: {
        ordering: '-created_at',
        limit: limit,
        status: 'active', // 販売中のもののみ
      }
    });
    return response.data; // DRF の limit/offset pagination を使っている場合、結果は results キーの中にある可能性あり
    // その場合は response.data.results を返すように修正
  } catch (error) {
    console.error('Error fetching new products:', error);
    return [];
  }
};

// おすすめ商品を取得する関数 (ランダム N 件)
export const getFeaturedProducts = async (limit: number = 5): Promise<Product[]> => {
   console.log(`[getFeaturedProducts] Fetching ${limit} random products from API`);
  try {
    // ordering=? でランダムソート、limit で件数指定
    const response = await apiClient.get<Product[]>('/products/', {
      params: {
        ordering: '?',
        limit: limit,
        status: 'active', // 販売中のもののみ
      }
    });
     // return response.data.results ?? response.data; // Pagination 対応
     return response.data; // Pagination 未使用と仮定
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
};

// 注意: DRF の Pagination 設定によっては、上記のレスポンス形式が
// { count: X, next: "...", previous: "...", results: [...] } のようになる場合があります。
// その場合は、response.data.results を返すように修正してください。
// もし Pagination を使っていないなら、response.data で OK です。