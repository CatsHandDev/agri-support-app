// frontend/src/types/cart.ts
import { Product } from './product'; // 既存の Product 型をインポート

export interface CartItem {
  product: Product; // 商品情報全体を保持
  quantity: number; // カート内の数量
}

// カート全体の型
export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}