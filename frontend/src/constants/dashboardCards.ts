// カードの種類を定義 (アイコンなど将来的な拡張用)
export enum CardType {
  ProductNew = 'productNew',
  ProductManage = 'productManage',
  Profile = 'profile',
  // 今後追加するカード (例: 注文管理、メッセージなど)
  // OrderManage = 'orderManage',
  // Messages = 'messages',
}

// 各カードの表示に必要な情報
export interface DashboardCard {
  id: CardType;
  title: string;
  description: string;
  link: string;
  icon?: string; // アイコン用 (例: Heroicons の名前など)
  requiredRoles?: ('authenticated' | 'producer')[]; // 表示に必要なロール
}

// カードデータの配列
export const dashboardCards: DashboardCard[] = [
  {
    id: CardType.ProductNew,
    title: '新しい商品を登録',
    description: '新しい商品情報を登録して出品を開始します。',
    link: '/my-products/new',
    icon: 'PlusCircleIcon', // 例: Heroicons
    requiredRoles: ['authenticated', 'producer'], // ログイン済み かつ 生産者
  },
  {
    id: CardType.ProductManage,
    title: '自分の商品を管理',
    description: '出品中の商品の編集、ステータス変更、削除を行います。',
    link: '/my-products',
    icon: 'ArchiveBoxIcon', // 例: Heroicons
    requiredRoles: ['authenticated', 'producer'], // ログイン済み かつ 生産者
  },
  {
    id: CardType.Profile,
    title: 'プロフィール編集',
    description: '農園情報や自己紹介などを編集します。',
    link: '/profile',
    icon: 'UserCircleIcon', // 例: Heroicons
    requiredRoles: ['authenticated'], // ログイン済みであれば OK
  },
  // --- 今後追加するカードの例 ---
  // {
  //   id: CardType.OrderManage,
  //   title: '注文管理',
  //   description: '受けた注文の確認や発送処理を行います。',
  //   link: '/orders/manage',
  //   icon: 'ShoppingBagIcon',
  //   requiredRoles: ['authenticated', 'producer'],
  // },
  // {
  //   id: CardType.Messages,
  //   title: 'メッセージ',
  //   description: '実需者とのメッセージを確認・返信します。',
  //   link: '/messages',
  //   icon: 'ChatBubbleLeftRightIcon',
  //   requiredRoles: ['authenticated'],
  // },
];