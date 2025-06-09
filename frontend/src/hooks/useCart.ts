// frontend/src/hooks/useCart.ts
import { useAtom, useAtomValue, useSetAtom } from 'jotai'; // useAtomValue, useSetAtom を使用
import {
  cartItemsAtom,
  cartTotalItemsAtom,
  cartTotalPriceAtom,
  addToCartAtom as baseAddToCartAtom, // 名前衝突を避けるため別名
  removeFromCartAtom as baseRemoveFromCartAtom,
  updateCartItemQuantityAtom as baseUpdateQuantityAtom,
  clearCartAtom as baseClearCartAtom,
} from '@/atoms/cartAtoms';
import { Product } from '@/types/product';
import { useCallback } from 'react';

export function useCart() {
  const [items, setItems] = useAtom(cartItemsAtom); // カートアイテムの読み書き
  const totalItems = useAtomValue(cartTotalItemsAtom); // 読み取り専用
  const totalPrice = useAtomValue(cartTotalPriceAtom); // 読み取り専用

  // 書き込み専用 Atom のセッターを取得
  const baseAddToCart = useSetAtom(baseAddToCartAtom);
  const baseRemoveFromCart = useSetAtom(baseRemoveFromCartAtom);
  const baseUpdateQuantity = useSetAtom(baseUpdateQuantityAtom);
  const baseClearCart = useSetAtom(baseClearCartAtom);

  // より使いやすいインターフェースでアクションを提供
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    baseAddToCart(product, quantity);
    // ここで通知を表示するなどの副作用を追加可能
    // alert(`${product.name} をカートに追加しました。`);
  }, [baseAddToCart]);

  const removeFromCart = useCallback((productId: number) => {
    baseRemoveFromCart(productId);
  }, [baseRemoveFromCart]);

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    baseUpdateQuantity(productId, newQuantity);
  }, [baseUpdateQuantity]);

  const clearCart = useCallback(() => {
    baseClearCart();
  }, [baseClearCart]);

  // カート内に特定の商品があるか確認する関数 (任意)
  const isInCart = useCallback((productId: number): boolean => {
    return items.some(item => item.product.id === productId);
  }, [items]);

  // 特定の商品の数量を取得する関数 (任意)
  const getItemQuantity = useCallback((productId: number): number => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }, [items]);


  return {
    cartItems: items, // または単に items
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateItemQuantity: updateQuantity, // 別名でエクスポート
    clearCart,
    isInCart, // 任意
    getItemQuantity, // 任意
  };
}