// frontend/src/atoms/cartAtoms.ts
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { CartItem } from '@/types/cart';
import { Product } from '@/types/product';

// localStorage 用のストレージ設定
const storage = createJSONStorage<CartItem[]>(() => localStorage);

// カート内商品リストの Atom (localStorage に永続化)
export const cartItemsAtom = atomWithStorage<CartItem[]>(
  'cartItems', // localStorage で使われるキー
  [],          // 初期値は空の配列
  {
    ...storage,
    // getItem が null や undefined を返した場合の初期値は第二引数の []
  }
);

// --- 派生 Atom (Derived Atoms) ---

// カート内の合計商品数を計算する Atom
export const cartTotalItemsAtom = atom<number>(
  (get) => {
    const items = get(cartItemsAtom);
    return items.reduce((total, item) => total + item.quantity, 0);
  }
);

// カート内の合計金額を計算する Atom
export const cartTotalPriceAtom = atom<number>(
  (get) => {
    const items = get(cartItemsAtom);
    return items.reduce((total, item) => {
      // product.price は文字列なので数値に変換
      const price = parseFloat(item.product.price);
      return total + (price * item.quantity);
    }, 0);
  }
);


// カートに商品を追加する Atom (既存なら数量を増やす)
export const addToCartAtom = atom(
  null, // 読み取りはしない
  (get, set, product: Product, quantity: number = 1) => {
    const currentItems = get(cartItemsAtom);
    const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      // 商品が既にカートにある場合、数量を増やす
      const updatedItems = currentItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      set(cartItemsAtom, updatedItems);
    } else {
      // 商品がカートにない場合、新しく追加
      set(cartItemsAtom, [...currentItems, { product, quantity }]);
    }
    console.log('[CartAtom] Product added/updated:', product.name, 'Quantity:', quantity);
  }
);

// カートから商品を削除する Atom
export const removeFromCartAtom = atom(
  null,
  (get, set, productId: number) => {
    const currentItems = get(cartItemsAtom);
    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    set(cartItemsAtom, updatedItems);
    console.log('[CartAtom] Product removed:', productId);
  }
);

// カート内の商品の数量を変更する Atom
export const updateCartItemQuantityAtom = atom(
  null,
  (get, set, productId: number, newQuantity: number) => {
    const currentItems = get(cartItemsAtom);
    if (newQuantity <= 0) {
      // 数量が0以下なら商品を削除
      set(removeFromCartAtom, productId);
    } else {
      const updatedItems = currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
      set(cartItemsAtom, updatedItems);
      console.log('[CartAtom] Product quantity updated:', productId, 'New Quantity:', newQuantity);
    }
  }
);

// カートを空にする Atom
export const clearCartAtom = atom(
  null,
  (get, set) => {
    set(cartItemsAtom, []);
    console.log('[CartAtom] Cart cleared.');
  }
);