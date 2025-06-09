// Django の User モデルと UserSerializer に合わせて定義
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_producer: boolean;
}