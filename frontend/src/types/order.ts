// frontend/src/types/order.ts
import { Product } from './product'; // OrderItem で使う

export interface OrderItem {
  product: any;
  id: number;
  product_id: number; // 作成時用
  product_name: string; // 表示用
  quantity: number;
  price_at_purchase: string; // 文字列で受け取る想定
  // product?: Product; // 詳細表示用に Product をネストする場合
}

export interface Order {
  id: number;
  order_id: string; // UUIDなど
  user_username: string | null;
  created_at: string;
  updated_at: string;
  shipping_full_name: string;
  shipping_postal_code: string;
  shipping_prefecture: string;
  shipping_city: string;
  shipping_address1: string;
  shipping_address2: string | null;
  shipping_phone_number: string;
  total_amount: string; // 文字列で受け取る想定
  payment_method: string | null;
  payment_status: string;
  order_status: string;
  notes: string | null;
  items: OrderItem[]; // ネストされた注文商品リスト
}

export interface OrderPayloadItem {
  product_id: number;
  quantity: number;
}
export interface OrderPayload {
  shipping_full_name: string;
  shipping_postal_code: string;
  shipping_prefecture: string;
  shipping_city: string;
  shipping_address1: string;
  shipping_address2?: string;
  shipping_phone_number: string;
  payment_method: string;
  notes?: string;
  items: OrderPayloadItem[];
}

export interface PaginatedOrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}