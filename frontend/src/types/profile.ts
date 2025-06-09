export interface Profile {
  category: string;
  id: number;
  username: string;
  email: string;
  farm_name: string | null;
  location_prefecture: string | null;
  location_city: string | null;
  bio: string | null;
  image: string | null; // 画像 URL または null
  website_url: string | null;
  phone_number: string | null;
  certification_info: string | null;
  is_producer: boolean;
  last_name_kana: string | null;
  first_name_kana: string | null;
  postal_code: string | null;
  prefecture: string | null;         // ユーザーの住所
  city: string | null;               // ユーザーの住所
  address1: string | null;           // ユーザーの住所
  address2: string | null;           // ユーザーの住所
  phone_number_user: string | null;  // ユーザーの電話番号
  created_at: string;
  updated_at: string;
}