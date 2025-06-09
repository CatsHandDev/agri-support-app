// frontend/src/app/(authenticated)/checkout/page.tsx
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart'; // カート情報取得
import WithAuth from '@/components/auth/WithAuth'; // 認証ガード
import { createOrder } from '@/services/orderApi';
import {
  Container, Typography, Box, Grid, Paper, TextField, Button,
  CircularProgress, Alert, Divider, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Select, MenuItem, InputLabel, SelectChangeEvent,
  Avatar,
  Stack
} from '@mui/material';
import { AxiosError } from 'axios';
import { PREFECTURES } from '@/constants/addressData';
import { ShippingAddress, PaymentDetails } from '@/types/checkout';
import { getMyProfile } from '@/services/profileApi';
import { Profile } from '@/types/profile';
import { OrderPayload } from '@/types/order';

function CheckoutPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    shipping_full_name: user?.first_name && user?.last_name ? `${user.last_name} ${user.first_name}` : (user?.username || ''), // ユーザー名で初期化 (任意)
    shipping_postal_code: '',
    shipping_prefecture: '',
    shipping_city: '',
    shipping_address1: '',
    shipping_address2: '',
    shipping_phone_number: '',
  });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    payment_method: 'credit_card', // デフォルトの支払い方法
  });
  const [notes, setNotes] = useState(''); // 備考欄
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // --- カートが空なら商品一覧へリダイレクト (注文処理中でない場合のみ) ---
  useEffect(() => {
    // ★ isSubmitting が false で、かつ totalItems が 0 の場合のみリダイレクト
    if (!isSubmitting && totalItems === 0 && !submitSuccess) {
      console.log('[Checkout] Cart is empty and not submitting, redirecting to /products');
      router.push('/products');
    }
  }, [totalItems, router, isSubmitting, submitSuccess]);

 // プロフィール情報を取得して配送先フォームに初期セット
  useEffect(() => {
    // 認証済みで、ユーザー情報があり、かつプロフィールロードがまだの場合
    if (isAuthenticated && user && isLoadingProfile) {
      console.log('[Checkout] Fetching profile to populate shipping address...');
      getMyProfile()
        .then(profileData => {
          if (profileData) {
            console.log('[Checkout] Profile data fetched:', profileData);
            setShippingAddress(prev => ({
              ...prev, // 既存の値を保持しつつ上書き
              shipping_full_name: prev.shipping_full_name || (user.first_name && user.last_name ? `${user.last_name} ${user.first_name}` : user.username), // ユーザー名 or 氏名
              shipping_postal_code: profileData.postal_code || '',
              shipping_prefecture: profileData.prefecture || '',
              shipping_city: profileData.city || '',
              shipping_address1: profileData.address1 || '',
              shipping_address2: profileData.address2 || '',
              shipping_phone_number: profileData.phone_number_user || '',
            }));
          } else {
            console.warn('[Checkout] No profile data found, using default shipping address.');
            // プロフィールがない場合、ユーザー名で氏名を初期化 (任意)
            if (!shippingAddress.shipping_full_name && user.username) {
              setShippingAddress(prev => ({...prev, shipping_full_name: user.username}));
            }
          }
        })
        .catch(error => {
          console.error("Failed to fetch profile for checkout", error);
          // プロフィール取得失敗時はデフォルト値のままにする
        })
        .finally(() => {
          setIsLoadingProfile(false); // プロフィールロード完了
        });
    } else if (!isAuthenticated && !authLoading) {
        // 未認証なら何もしない (WithAuth がリダイレクトするはず)
    } else if (isAuthenticated && user && !isLoadingProfile) {
        // 既にプロフィールロード済み or user情報なし
        setIsLoadingProfile(false); // 念のため
    }
  }, [isAuthenticated, user, authLoading, isLoadingProfile, shippingAddress.shipping_full_name]);

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handlePrefectureChange = (event: SelectChangeEvent<string>) => {
    setShippingAddress(prev => ({ ...prev, shipping_prefecture: event.target.value }));
    if (errors.shipping_prefecture) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.shipping_prefecture;
        return newErrors;
      });
    }
  };

  const handlePaymentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentDetails({ payment_method: event.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (totalItems === 0) {
      alert('カートが空です。');
      setIsSubmitting(false);
      return;
    }

    const orderPayload: OrderPayload = {
      shipping_full_name: shippingAddress.shipping_full_name,
      shipping_postal_code: shippingAddress.shipping_postal_code,
      shipping_prefecture: shippingAddress.shipping_prefecture,
      shipping_city: shippingAddress.shipping_city,
      shipping_address1: shippingAddress.shipping_address1,
      shipping_address2: shippingAddress.shipping_address2,
      shipping_phone_number: shippingAddress.shipping_phone_number,
      payment_method: paymentDetails.payment_method,
      notes: notes,
      items: cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      // total_amount はバックエンドで計算
    };

    try {
      const createdOrder = await createOrder(orderPayload);
      clearCart();
      setSubmitSuccess(true);
      router.push(`/order-confirmation/${createdOrder.order_id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      if (error instanceof AxiosError && error.response?.data) {
        const responseData = error.response.data as any; // any にキャスト
        // ★ バックエンドからのバリデーションエラーをセット
        //    responseData がオブジェクトでない場合も考慮
        if (typeof responseData === 'object' && responseData !== null) {
          const newErrors: Record<string, any> = {};
          // DRF のエラー形式 { field_name: ["message"], ... } や { detail: "message" }
          for (const key in responseData) {
            if (Array.isArray(responseData[key])) {
              newErrors[key] = responseData[key].join(' '); // 配列なら文字列に
            } else {
              newErrors[key] = String(responseData[key]); // 文字列に変換
            }
          }
          // items の中のエラー (例: items[0].product_id) は別途処理が必要かも
          if (responseData.items && Array.isArray(responseData.items)) {
            responseData.items.forEach((itemError: any, index: number) => {
              if (typeof itemError === 'object' && itemError !== null) {
                for (const itemKey in itemError) {
                  newErrors[`items[${index}].${itemKey}`] = Array.isArray(itemError[itemKey]) ? itemError[itemKey].join(' ') : String(itemError[itemKey]);
                }
              }
            });
          }
          setErrors(newErrors);
          if (Object.keys(newErrors).length > 0) {
            alert('入力内容にエラーがあります。ご確認ください。');
          } else if (responseData.detail) { // detail キーがある場合
            setErrors({ form: [String(responseData.detail)] });
            alert(String(responseData.detail));
          } else {
            setErrors({ form: ['注文処理中にエラーが発生しました。'] });
            alert('注文処理中にエラーが発生しました。');
          }
        } else if (typeof responseData === 'string') {
          setErrors({ form: [responseData] });
          alert(responseData);
        } else {
          setErrors({ form: ['注文処理中に予期せぬサーバーエラーが発生しました。'] });
          alert('注文処理中に予期せぬサーバーエラーが発生しました。');
        }
      } else if (error instanceof Error) {
        setErrors({ form: [error.message] });
      } else {
        setErrors({ form: ['注文処理中に予期せぬエラーが発生しました。'] });
      }
      window.scrollTo(0, 0); // エラー表示のためトップへ
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WithAuth>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" mb={4}>
          ご注文手続き
        </Typography>

        <Grid container spacing={5}>
          {/* 左側: 注文内容確認・配送先・支払い */}
          <Grid sx={{ xs: 12, md: 7 }}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>ご注文内容</Typography>
              {cartItems.map(item => (
                <Box key={item.product.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                  <Avatar
                      src={item.product.image ? `${mediaBaseUrl}${item.product.image}` : undefined}
                      variant="square" sx={{ width: 60, height: 60, mr: 1, bgcolor: 'grey.100' }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">{item.product.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      単価: {parseInt(item.product.price).toLocaleString()}円 x {item.quantity}点
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {(parseFloat(item.product.price) * item.quantity).toLocaleString()} 円
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">小計 ({totalItems}点)</Typography>
                <Typography variant="h6">{totalPrice.toLocaleString()} 円</Typography>
              </Stack>
              <Typography variant="caption" display="block" textAlign="right">(税込・送料別)</Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 3 }}>
              <Box component="form" id="checkout-form" onSubmit={handleSubmit} noValidate>
                {/* --- 配送先情報 --- */}
                <Typography variant="h6" gutterBottom>お届け先情報</Typography>
                {errors.form && <Alert severity="error" sx={{width: '100%', mb:2}}>{Array.isArray(errors.form) ? errors.form.join(', ') : errors.form}</Alert>}
                <Grid container direction="column" spacing={2}>
                  <Grid sx={{ xs: 12 }}>
                    <TextField
                      required
                      fullWidth
                      label="お名前（フルネーム）"
                      name="shipping_full_name"
                      value={shippingAddress.shipping_full_name}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_full_name}
                      helperText={
                        errors.shipping_full_name
                          ? Array.isArray(errors.shipping_full_name)
                            ? errors.shipping_full_name.join(', ')
                            : errors.shipping_full_name
                          : ''
                      }
                    />
                  </Grid>
                  <Grid sx={{ xs: 12, sm: 6 }}>
                    <TextField
                      required
                      fullWidth
                      label="郵便番号 (ハイフンなし)"
                      name="shipping_postal_code"
                      value={shippingAddress.shipping_postal_code}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_postal_code}
                      helperText={
                        errors.shipping_postal_code
                          ? Array.isArray(errors.shipping_postal_code)
                            ? errors.shipping_postal_code.join(', ')
                            : errors.shipping_postal_code
                          : ''
                      }
                    />
                  </Grid>
                  <Grid sx={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth required error={!!errors.shipping_prefecture}>
                      <InputLabel id="shipping-prefecture-label">都道府県</InputLabel>
                      <Select
                        labelId="shipping-prefecture-label"
                        name="shipping_prefecture"
                        value={shippingAddress.shipping_prefecture}
                        label="都道府県"
                        onChange={handlePrefectureChange}
                      >
                        <MenuItem value=""><em>選択してください</em></MenuItem>
                        {PREFECTURES.map(pref => <MenuItem key={pref} value={pref}>{pref}</MenuItem>)}
                      </Select>
                      {errors.shipping_prefecture && (
                        <Typography color="error" variant="caption" sx={{ml:1.5, mt:0.5}}>
                          {Array.isArray(errors.shipping_prefecture) // ★ 配列かどうかチェック
                            ? errors.shipping_prefecture.join(', ') // 配列なら join
                            : errors.shipping_prefecture // 文字列ならそのまま表示
                          }
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField
                      required
                      fullWidth
                      label="市区町村"
                      name="shipping_city"
                      value={shippingAddress.shipping_city}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_city}
                      helperText={
                        errors.shipping_city
                          ? Array.isArray(errors.shipping_city)
                            ? errors.shipping_city.join(', ')
                            : errors.shipping_city
                          : ''
                      }
                    />
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField
                      required
                      fullWidth
                      label="番地・建物名など"
                      name="shipping_address1"
                      value={shippingAddress.shipping_address1}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_address1}
                      helperText={
                        errors.shipping_address1
                          ? Array.isArray(errors.shipping_address1)
                            ? errors.shipping_address1.join(', ')
                            : errors.shipping_address1
                          : ''
                      }
                    />
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="アパート・マンション名、部屋番号 (任意)"
                      name="shipping_address2"
                      value={shippingAddress.shipping_address2}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_address2}
                      helperText={
                        errors.shipping_address2
                          ? Array.isArray(errors.shipping_address2)
                            ? errors.shipping_address2.join(', ')
                            : errors.shipping_address2
                          : ''
                      }
                    />
                  </Grid>
                  <Grid sx={{ xs: 12 }}>
                    <TextField
                      required
                      fullWidth
                      label="電話番号 (ハイフンなし)"
                      name="shipping_phone_number"
                      type="tel"
                      value={shippingAddress.shipping_phone_number}
                      onChange={handleShippingChange}
                      error={!!errors.shipping_phone_number}
                      helperText={
                        errors.shipping_phone_number
                          ? Array.isArray(errors.shipping_phone_number)
                            ? errors.shipping_phone_number.join(', ')
                            : errors.shipping_phone_number
                          : ''
                      }
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* --- 支払い方法 --- */}
                <Typography variant="h6" gutterBottom>お支払い方法</Typography>
                <FormControl component="fieldset" error={!!errors.payment_method}>
                  <RadioGroup row aria-label="支払い方法" name="payment_method" value={paymentDetails.payment_method} onChange={handlePaymentChange}>
                    <FormControlLabel value="credit_card" control={<Radio />} label="クレジットカード" />
                    <FormControlLabel value="bank_transfer" control={<Radio />} label="銀行振込 (準備中)" disabled />
                    {/* 他の支払い方法 */}
                  </RadioGroup>
                  {errors.payment_method && (
                    <Typography color="error" variant="caption" sx={{ml:1.5, mt:0.5}}>
                      {Array.isArray(errors.payment_method) // ★ 配列かどうかチェック
                        ? errors.payment_method.join(', ') // 配列なら join
                        : errors.payment_method // 文字列ならそのまま表示
                      }
                    </Typography>
                  )}
                </FormControl>
                  {paymentDetails.payment_method === 'credit_card' && (
                    <Box sx={{mt: 2, p:2, border: '1px dashed grey', borderRadius: 1}}>
                      <Typography variant="body2" color="text.secondary">
                        クレジットカード情報は、この後の画面（決済サービス提供）で安全に入力いただきます。
                        ここではカード情報を入力する必要はありません。
                      </Typography>
                    </Box>
                  )}

                <Divider sx={{ my: 3 }} />
                {/* --- 備考欄 --- */}
                <Typography variant="h6" gutterBottom>備考欄</Typography>
                <TextField fullWidth label="配送日時指定やその他ご要望があればご記入ください" name="notes" multiline rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Box>
            </Paper>
          </Grid>

          {/* 右側: 注文概要・確定ボタン */}
          <Grid sx={{ xs: 12, md: 5 }}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: '80px' }}>
              <Typography variant="h6" gutterBottom>ご注文概要</Typography>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">商品小計 ({totalItems} 点)</Typography>
                  <Typography fontWeight="medium">{totalPrice.toLocaleString()} 円</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">送料</Typography>
                  <Typography>別途計算</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap="1ch">
                  <Typography variant="h6" fontWeight="bold">お支払い合計</Typography>
                  <Box textAlign="right">
                    <Typography variant="h5" fontWeight="bold" color="primary.dark">
                      {totalPrice.toLocaleString()} 円
                    </Typography>
                    <Typography variant="caption" component="div">(税込・送料別)</Typography>
                  </Box>
                </Stack>
              </Stack>
              {/* フォーム送信ボタン (Box form="checkout-form" で関連付け) */}
              <Button
                type="submit"
                form="checkout-form" // ★ 上の form の id を指定
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={isSubmitting || totalItems === 0}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? '注文処理中...' : '注文を確定する'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </WithAuth>
  );
}

export default function Checkout() {
  return (
    <WithAuth>
      <CheckoutPageContent />
    </WithAuth>
  );
}

