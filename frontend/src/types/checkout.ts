// 配送先情報と支払い方法の型
export interface ShippingAddress {
  shipping_full_name: string;
  shipping_postal_code: string;
  shipping_prefecture: string;
  shipping_city: string;
  shipping_address1: string;
  shipping_address2: string;
  shipping_phone_number: string;
}

export interface PaymentDetails {
  payment_method: 'credit_card' | 'bank_transfer' | string; // string は他の方法用
}