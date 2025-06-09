'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMyProducts, deleteProduct, updateProductStatus } from '@/services/productApi';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import WithProducerAuth from '@/components/auth/withProducerAuth';

export default function MyProductsPage() {
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // データ取得関数
  const loadMyProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyProducts();
      setMyProducts(data);
    } catch (error) {
      console.error("Failed to load my products", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ページ表示時にデータを読み込む (認証チェック後なので安全)
  useEffect(() => {
    loadMyProducts();
  }, [loadMyProducts]);

  // ★ ローディング状態を設定するヘルパー関数
  const handleActionStart = (id: number) => setActionLoading(prev => ({ ...prev, [id]: true }));
  const handleActionEnd = (id: number) => setActionLoading(prev => ({ ...prev, [id]: false }));

  // ★ ステータス変更ハンドラ
  const handleStatusChange = async (id: number, newStatus: Product['status']) => {
    if (actionLoading[id]) return; // 既に処理中なら何もしない
    handleActionStart(id);
    try {
      await updateProductStatus(id, newStatus);
      // 成功したらリストを再読み込みして表示を更新
      await loadMyProducts();
      alert(`ステータスを「${newStatus === 'active' ? '販売中' : '販売停止'}」に変更しました。`); // 簡単なフィードバック
    } catch (error: any) {
      console.error("Failed to change status", error);
      alert(`ステータス変更に失敗しました: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      handleActionEnd(id);
    }
  };

  // ★ 削除ハンドラ
  const handleDelete = async (id: number) => {
    if (actionLoading[id]) return;
    // 確認ダイアログ
    if (!window.confirm('この商品を削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }
    handleActionStart(id);
    try {
      await deleteProduct(id);
      // 成功したらリストから削除 (再読み込みでも良い)
      setMyProducts(prev => prev.filter(p => p.id !== id));
      alert('商品を削除しました。');
    } catch (error: any) {
      console.error("Failed to delete product", error);
      alert(`削除に失敗しました: ${error.response?.data?.detail || error.message || '不明なエラー'}`);
    } finally {
      handleActionEnd(id);
    }
  };

  // ★ ローディング表示はデータ取得中に限定
  if (isLoading) {
    return <div className={styles.loading}>自分の商品を読み込み中...</div>;
  };

  return (
    <WithProducerAuth>
      <div className={styles.container}>
        {/* ... (ヘッダー部分) ... */}
        <div className={styles.header}>
          <h1 className={styles.title}>自分の商品管理</h1>
          <Link href="/my-products/new" className={styles.addButton}>
            + 新しい商品を追加
          </Link>
        </div>

        {myProducts.length === 0 ? ( <p>商品はまだ登録されていません。</p> ) : (
          <div className={styles.productList}>
            {myProducts.map((product) => (
              <div key={product.id} className={`${styles.productItem} ${actionLoading[product.id] ? styles.itemLoading : ''}`}>
                <div className={styles.productItemWrapper}>
                  {/* ===== 画像表示部分 ===== */}
                  <div className={styles.productImage}>
                    {product.image ? (
                      <Image
                        src={`${product.image}`}
                        alt={product.name}
                        width={80} // 固定サイズ指定
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: '4px' }} // カバー表示、角丸
                      />
                    ) : (
                      <div className={styles.noImage}>画像なし</div>
                    )}
                  </div>
                  {/* ===== 商品情報表示部分 ===== */}
                  <div className={styles.productInfo}>
                    {/* ===== ステータス表示部分 ===== */}
                    <div className={styles.productStatus}>
                      <span className={`${styles.statusBadge} ${styles['status' + product.status.charAt(0).toUpperCase() + product.status.slice(1)]}`}>
                        {product.status_display}
                      </span>
                    </div>
                    {/* 商品名 (詳細ページへのリンク) */}
                    <Link href={`/my-products/${product.id}`} className={styles.productNameLink} title={product.name}>
                      {product.name}
                    </Link>
                    {/* 価格 */}
                    <p className={styles.productPrice}>
                      {parseInt(product.price, 10).toLocaleString()} 円
                      <span className={styles.unitInfo}> / {product.quantity} {product.unit_display}</span>
                    </p>
                    {/* (任意) カテゴリや規格など簡単な情報を追加 */}
                    {/* <p className={styles.productMeta}>{product.category || '-'} / {product.standard || '-'}</p> */}
                  </div>
                </div>

                {/* ↓↓↓ アクションボタン ↓↓↓ */}
                <div className={styles.productActions}>
                  {/* 編集ボタン */}
                  <Link href={`/my-products/${product.id}/`} className={`${styles.actionButton} ${styles.activateButton} ${actionLoading[product.id] ? styles.disabled : ''}`}>
                    編集
                  </Link>

                  {/* ステータス変更ボタン */}
                  {product.status === 'draft' || product.status === 'inactive' ? (
                    <button
                      className={`${styles.actionButton} ${styles.activateButton} ${actionLoading[product.id] ? styles.disabled : ''}`}
                      onClick={() => handleStatusChange(product.id, 'active')}
                      disabled={actionLoading[product.id]}
                    >
                      販売開始
                    </button>
                  ) : product.status === 'active' ? (
                    <button
                      className={`${styles.actionButton} ${styles.deactivateButton} ${actionLoading[product.id] ? styles.disabled : ''}`}
                      onClick={() => handleStatusChange(product.id, 'inactive')}
                      disabled={actionLoading[product.id]}
                    >
                      販売停止
                    </button>
                  ) : null}

                  {/* 削除ボタン (下書きや停止中のみ表示するなど、条件は任意) */}
                  { (product.status === 'draft' || product.status === 'inactive') && (
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton} ${actionLoading[product.id] ? styles.disabled : ''}`}
                      onClick={() => handleDelete(product.id)}
                      disabled={actionLoading[product.id]}
                    >
                      削除
                    </button>
                  )}
                </div>
                {/* ↓↓↓ ローディングオーバーレイ (任意) ↓↓↓ */}
                {actionLoading[product.id] && <div className={styles.loadingOverlay}>処理中...</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </WithProducerAuth>
  );
}
