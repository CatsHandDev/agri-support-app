// frontend/src/types/favorite.ts
import { Product } from './product'; // Product 型をインポート

// API (/api/favorites/products/) のレスポンスで使われる型
export interface FavoriteProduct {
  id: number;         // FavoriteProduct モデル自体の ID
  product: Product;   // ネストされた Product 情報
  created_at: string;
  // 必要に応じて user 情報なども追加 (API仕様による)
  // userId?: number;
}

// (リスト用の型エイリアスもここに定義しても良い)
// export type FavoriteListResponse = FavoriteProduct[];