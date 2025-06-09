// Django の Product モデルと ProductSerializer に合わせて定義

export interface Product {
  id: number;
  producer_username: string; // 読み取り用のフィールド
  name: string;
  description: string;
  category: string | null;
  price: string; // DecimalField
  quantity: string; // DecimalField
  unit: string;
  unit_display: string; // 読み取り用のフィールド
  image: string | null; // 画像 URL または null
  standard: string | null;
  cultivation_method: string | null;
  cultivation_method_display: string | null; // 読み取り用のフィールド
  harvest_時期: string | null;
  shipping_available_時期: string | null;
  allergy_info: string | null;
  storage_method: string | null;
  status: 'draft' | 'pending' | 'active' | 'inactive';
  status_display: string;
  created_at: string; // DateTimeField
  updated_at: string; // DateTimeField
}