// frontend/src/services/orderApi.ts
import apiClient from '@/lib/axios';
import { Order, OrderPayload, PaginatedOrderResponse } from '@/types/order';
import { CartItem } from '@/types/cart';
import axios from 'axios';

// 注文を作成する関数
export const createOrder = async (payload: OrderPayload): Promise<Order> => {
  console.log('[createOrder API] Sending order payload:', payload);
  try {
    const response = await apiClient.post<Order>('/orders/', payload);
    console.log('[createOrder API] Order creation successful:', response.data);
    return response.data; // 作成された注文情報を返す
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('[createOrder API] Order creation failed:', error.response.data);
      throw error; // エラーオブジェクト全体を投げてフォーム側で処理
    } else {
      console.error('[createOrder API] Unexpected error during order creation:', error);
      throw new Error('注文処理中に予期せぬエラーが発生しました。');
    }
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  console.log(`[getOrderById API] Fetching order details for orderId: ${orderId}`);
  try {
    const response = await apiClient.get<Order>(`/my-orders/${orderId}/`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`Order not found for orderId: ${orderId}`);
      return null;
    }
    console.error(`Error fetching order details for ${orderId}:`, error);
    throw error;
  }
};

// 自分の注文履歴一覧を取得する関数
export const getMyOrders = async (page: number = 1, pageSize: number = 10): Promise<PaginatedOrderResponse> => {
  console.log(`[getMyOrders API] Fetching orders for page: ${page}, size: ${pageSize}`);
  try {
    // API がページネーションパラメータを解釈してくれると期待
    const response = await apiClient.get<PaginatedOrderResponse>('/my-orders/', { // ★ 返り値の型を Order[] に
      params: {
        page: page,
        page_size: pageSize,
        ordering: '-created_at',
      }
    });
  // ★ APIが期待通りのPaginatedOrderResponseを返すか確認・調整
    if (response.data && Array.isArray(response.data.results) && typeof response.data.count === 'number') {
      return response.data;
    } else {
      console.warn("[getMyOrders API] Received unexpected response format:", response.data);
      // ★ 期待しない形式でも results が配列である空のページネーションオブジェクトを返す
      return { count: 0, next: null, previous: null, results: [] };
    }
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return { count: 0, next: null, previous: null, results: [] };
  }
};

// 生産者が自分の商品関連の注文一覧を取得する関数
export const getProducerOrders = async (page: number = 1, pageSize: number = 10, filters?: { order_status?: string; search?: string; ordering?: string }): Promise<PaginatedOrderResponse> => {
  try {
    const response = await apiClient.get<PaginatedOrderResponse>('/producer-orders/', {
      params: {
        page: page,
        page_size: pageSize,
        ordering: filters?.ordering || '-created_at',
        order_status: filters?.order_status || undefined, // status フィルタ
        search: filters?.search || undefined, // search フィルタ
      }
    });
    if (response.data && typeof response.data.count === 'number' && Array.isArray(response.data.results)) {
      return response.data;
    } else {
      console.warn("[getProducerOrders API] Unexpected paginated response format:", response.data);
      return { count: 0, next: null, previous: null, results: [] };
    }
  } catch (error) {
    console.error('Error fetching producer orders:', error);
    return { count: 0, next: null, previous: null, results: [] };
  }
};

// 生産者が注文ステータスを更新する関数
export const updateOrderStatusByProducer = async (orderId: string, newStatus: Order['order_status']): Promise<Order> => {
  console.log(`[updateOrderStatus API] Updating order ${orderId} to status ${newStatus}`);
  try {
    // /api/orders/received/{order_id}/ に PATCH
    const response = await apiClient.patch<Order>(`/producer-orders/${orderId}/`, { order_status: newStatus });
    return response.data;
  } catch (error: any) {
    console.error(`Error updating order status for ${orderId}:`, error.response?.data || error.message);
    throw error;
  }
};

// 生産者が注文を発送済みにする API
export const markOrderAsShipped = async (orderId: string): Promise<Order> => {
  console.log(`[markOrderAsShipped API] Marking order ${orderId} as shipped`);
  try {
    // /api/orders/as-producer/{order_id}/mark-shipped/ に POST
    const response = await apiClient.post<Order>(`/orders/producer-orders/${orderId}/mark-shipped/`);
    return response.data; // 更新された注文情報を返す
  } catch (error: any) {
    console.error(`Error marking order ${orderId} as shipped:`, error.response?.data || error.message);
    throw error;
  }
};

// 生産者が特定の注文詳細を取得する関数
export const getProducerOrderByOrderId = async (orderId: string): Promise<Order | null> => {
  console.log(`[getProducerOrderByOrderId API] Fetching order details for orderId: ${orderId}`);
  try {
    // /api/orders/as-producer/{order_id}/ を呼び出す
    const response = await apiClient.get<Order>(`/orders/producer-orders/${orderId}/`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`Producer order not found for orderId: ${orderId}`);
      return null;
    }
    console.error(`Error fetching producer order details for ${orderId}:`, error);
    throw error;
  }
};