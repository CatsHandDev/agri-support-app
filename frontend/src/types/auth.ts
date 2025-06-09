export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string; // パスワード確認用
  first_name?: string; // オプション
  last_name?: string;  // オプション
}