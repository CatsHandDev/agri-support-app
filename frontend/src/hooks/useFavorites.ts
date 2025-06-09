// frontend/src/hooks/useFavorites.ts
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  favoriteProductIdsAtom,
  favoriteItemsAtom,
  loadFavoritesAtom,
  toggleFavoriteAtom as baseToggleFavoriteAtom,
  clearFavoritesAtom as baseClearFavoritesAtom,
} from '@/atoms/favoriteAtoms';
import { useCallback, useEffect } from 'react';

export function useFavorites() {
  const [favoriteProductIds] = useAtom(favoriteProductIdsAtom); // IDリスト読み取り
  const [favoriteItems] = useAtom(favoriteItemsAtom); // ★ アイテムリスト読み取り
  const loadFavorites = useSetAtom(loadFavoritesAtom); // ★ 初期化関数
  const toggleFavorite = useSetAtom(baseToggleFavoriteAtom); // 書き込み専用
  const clearFavorites = useSetAtom(baseClearFavoritesAtom); // 書き込み専用

  // ★ アプリ初期化 or 認証状態変更時にデータをロード
  useEffect(() => {
    // TODO: 認証済みの場合のみロードする (useAuth と連携)
    // const { isAuthenticated } = useAuth();
    // if (isAuthenticated) {
    loadFavorites();
    // }
  }, [loadFavorites]);

  // 特定の商品がお気に入りかどうかをチェックする関数
  const isFavorite = useCallback((productId: number): boolean => {
    return favoriteProductIds.includes(productId);
  }, [favoriteProductIds]);

  // トグル関数 (コンポーネント側で使いやすいようにラップ)
  const handleToggleFavorite = useCallback((productId: number) => {
    toggleFavorite(productId);
    // TODO: ここで API 連携の結果に基づいて成功/失敗の通知を出すなど
  }, [toggleFavorite]);

  return {
    favoriteProductIds,     // お気に入りIDリスト
    favoriteItems,
    isFavorite,             // 特定の商品がお気に入りかチェックする関数
    toggleFavorite: handleToggleFavorite, // お気に入りをトグルする関数
    clearFavorites,         // すべて削除する関数
    favoritesCount: favoriteProductIds.length, // お気に入り件数
    loadFavorites,
  };
}