// frontend/src/atoms/favoriteAtoms.ts
import { atom } from 'jotai';
import { addFavoriteProduct, removeFavoriteProduct, getFavoriteProducts, FavoriteListResponse } from '@/services/favoriteApi';

// お気に入り商品 ID の配列を保持する Atom (メモリ上のみ)
export const favoriteProductIdsAtom = atom<number[]>([]);

// ★ API から取得したお気に入りデータ全体を保持する Atom (任意)
export const favoriteItemsAtom = atom<FavoriteListResponse>([]);

// ★ お気に入りリストを API から取得して Atom を初期化する Atom (非同期)
export const loadFavoritesAtom = atom(
  null, // read-only なので write 関数のみ
  async (get, set) => {
    console.log('[Favorite Atom] Loading favorites from API...');
    try {
      const favorites = await getFavoriteProducts(); // API 呼び出し
      set(favoriteItemsAtom, favorites); // 全データ Atom を更新
      // ID リスト Atom も更新
      set(favoriteProductIdsAtom, favorites.map(fav => fav.product.id));
      console.log('[Favorite Atom] Favorites loaded:', get(favoriteProductIdsAtom));
    } catch (error) {
      console.error('[Favorite Atom] Failed to load favorites from API', error);
      // エラー発生時は空にするなど
      set(favoriteItemsAtom, []);
      set(favoriteProductIdsAtom, []);
    }
  }
);


// 商品をお気に入りに追加/削除するトグル Atom (API 連携付き)
export const toggleFavoriteAtom = atom(
  null,
  async (get, set, productId: number) => {
    const currentIds = get(favoriteProductIdsAtom);
    const currentItems = get(favoriteItemsAtom); // ★ お気に入りアイテム全体も取得
    const isFavorite = currentIds.includes(productId);

    if (isFavorite) {
      // 削除処理
      const favoriteItem = currentItems.find(item => item.product.id === productId);
      if (favoriteItem) {
        try {
          console.log(`[Favorite Atom] Removing favorite via API: ${favoriteItem.id}`);
          await removeFavoriteProduct(favoriteItem.id); // ★ API 呼び出し (Favorite ID で削除)
          // 成功したら state を更新
          set(favoriteProductIdsAtom, currentIds.filter(id => id !== productId));
          set(favoriteItemsAtom, currentItems.filter(item => item.id !== favoriteItem.id));
          console.log(`[Favorite Atom] Removed product ${productId}`);
        } catch (error) {
          console.error(`[Favorite Atom] Failed to remove favorite product ${productId}`, error);
          // TODO: エラー通知
        }
      } else {
        console.warn(`[Favorite Atom] Could not find favorite item data for product ${productId} to remove.`);
        // 念のためIDリストからも削除
        set(favoriteProductIdsAtom, currentIds.filter(id => id !== productId));
      }
    } else {
      // 追加処理
      try {
        console.log(`[Favorite Atom] Adding favorite via API: ${productId}`);
        const newItem = await addFavoriteProduct(productId); // ★ API 呼び出し (Product ID で追加)
        // 成功したら state を更新
        set(favoriteProductIdsAtom, [...currentIds, productId]);
        set(favoriteItemsAtom, [...currentItems, newItem]); // ★ 追加されたアイテム情報で更新
        console.log(`[Favorite Atom] Added product ${productId}`);
      } catch (error) {
        console.error(`[Favorite Atom] Failed to add favorite product ${productId}`, error);
        // TODO: エラー通知 (既に追加済みの場合など)
      }
    }
  }
);

// お気に入りをすべてクリアする Atom
export const clearFavoritesAtom = atom(
  null,
  (get, set) => {
    set(favoriteProductIdsAtom, []);
    console.log('[Favorite Atom] Cleared all favorites.');
    // TODO: API連携
  }
);