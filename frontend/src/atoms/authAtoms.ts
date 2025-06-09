// frontend/src/atoms/authAtoms.ts
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { User } from '@/types/user';
import { TokenPair } from '@/types/auth';

// ===== 基本的な状態 Atom =====

// トークン (localStorage に保存)
// sessionStorage を使う場合は createJSONStorage(() => sessionStorage) に変更
const storage = createJSONStorage<string | null>(() => localStorage);

export const accessTokenAtom = atomWithStorage<string | null>('accessToken', null, {
  ...storage,
  // getItem が null を返した場合の初期値は第二引数の null になる
});
export const refreshTokenAtom = atomWithStorage<string | null>('refreshToken', null, {
  ...storage,
});

// ユーザー情報 (メモリ上のみ)
export const userAtom = atom<User | null>(null);

// ローディング状態 (メモリ上のみ)
export const authLoadingAtom = atom<boolean>(true); // 初期状態はローディング中

// エラーメッセージ (メモリ上のみ)
export const authErrorAtom = atom<string | null>(null);


// ===== 派生 Atom (Derived Atoms) =====

// 認証済みかどうかを判定する派生 Atom
export const isAuthenticatedAtom = atom<boolean>(
  (get) => !!get(accessTokenAtom) && !!get(userAtom) // トークンとユーザー情報が存在するか
);

// ===== 書き込み専用 Atom (Write-only Atoms) とアクション関数 =====

// トークンを設定する Atom (アクセストークンとリフレッシュトークンを同時に設定)
export const setTokensAtom = atom(
  null, // 読み取りはしない
  (get, set, tokens: TokenPair | { access: string | null; refresh: string | null } | null) => {
    if (tokens) {
      set(accessTokenAtom, tokens.access);
      set(refreshTokenAtom, tokens.refresh);
    } else {
      // null が渡されたらクリア
      set(accessTokenAtom, null);
      set(refreshTokenAtom, null);
    }
    // 必要に応じて Axios のヘッダーも更新 (インターセプターで実施するのが一般的)
  }
);

// 認証データをクリアする Atom
export const clearAuthDataAtom = atom(
  null,
  (get, set) => {
    set(setTokensAtom, null); // トークンをクリア
    set(userAtom, null);      // ユーザー情報をクリア
    set(authErrorAtom, null); // エラーをクリア
    // Axios ヘッダーのクリアも必要 (インターセプターで実施)
  }
);
