// frontend/src/services/favoriteApi.ts
import apiClient from '@/lib/axios';
import { FavoriteProduct } from '@/types/favorite';
import { Product } from '@/types/product';
import axios from 'axios';

// ★ FavoriteProduct 型定義 (serializers.py に合わせる)
export interface FavoriteProductResponse {
  id: number;
  product: Product; // ネストされた商品情報
  created_at: string;
}
// ★ API から返ってくるのはリストなので
export type FavoriteListResponse = FavoriteProductResponse[];

// お気に入り商品リストを取得
export const getFavoriteProducts = async (): Promise<FavoriteProduct[]> => {
  try {
    const response = await apiClient.get<FavoriteProduct[]>('/favorites/products/');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite products:', error);
    return [];
  }
};

// 商品をお気に入りに追加
export const addFavoriteProduct = async (productId: number): Promise<FavoriteProduct> => {
  try {
    // product_id を送信
    const response = await apiClient.post<FavoriteProduct>('/favorites/products/', { product_id: productId });
    return response.data;
  } catch (error: any) {
    console.error('Error adding favorite product:', error.response?.data || error.message);
    throw error; // エラーを再スローして呼び出し元で処理
  }
};

// 商品をお気に入りから削除 (FavoriteProduct の ID で削除)
export const removeFavoriteProduct = async (favoriteId: number): Promise<void> => {
  try {
  await apiClient.delete(`/favorites/products/${favoriteId}/`);
  } catch (error: any) {
    console.error('Error removing favorite product:', error.response?.data || error.message);
    throw error;
  }
};

// (もしカスタムアクションを実装した場合) 商品 ID で削除
// export const removeFavoriteProductByProductId = async (productId: number): Promise<void> => {
//     try {
//         await apiClient.delete(`/favorites/products/by_product/${productId}/`);
//     } catch (error: any) { /* ... */ }
// };