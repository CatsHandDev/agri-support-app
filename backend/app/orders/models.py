# backend/app/orders/models.py
from django.db import models  # type: ignore
from django.conf import settings  # type: ignore
from app.products.models import Product  # 商品モデルをインポート
import uuid  # 注文ID用に (任意)

User = settings.AUTH_USER_MODEL


class Order(models.Model):
    # --- 注文ステータス定数 ---
    ORDER_STATUS_PENDING = "pending_order"
    ORDER_STATUS_PROCESSING = "processing"
    ORDER_STATUS_SHIPPED = "shipped"
    ORDER_STATUS_COMPLETED = "completed"
    ORDER_STATUS_CANCELLED = "cancelled"
    ORDER_STATUS_REFUNDED_ORDER = "refunded_order"

    ORDER_STATUS_CHOICES = [
        (ORDER_STATUS_PENDING, "注文受付/支払い待ち"),
        (ORDER_STATUS_PROCESSING, "処理中"),
        (ORDER_STATUS_SHIPPED, "発送済み"),
        (ORDER_STATUS_COMPLETED, "完了"),
        (ORDER_STATUS_CANCELLED, "キャンセル済み"),
        (ORDER_STATUS_REFUNDED_ORDER, "注文返金済み"),
    ]

    # --- 支払いステータス定数 ---
    PAYMENT_STATUS_PENDING = "pending_payment"
    PAYMENT_STATUS_PAID = "paid"
    PAYMENT_STATUS_FAILED = "failed"
    PAYMENT_STATUS_REFUNDED_PAYMENT = "refunded_payment"

    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, "未払い"),
        (PAYMENT_STATUS_PAID, "支払い済み"),
        (PAYMENT_STATUS_FAILED, "支払い失敗"),
        (PAYMENT_STATUS_REFUNDED_PAYMENT, "支払い返金済み"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("credit_card", "クレジットカード"),
        ("bank_transfer", "銀行振込"),
        # 他の支払い方法
    ]

    order_id = models.CharField(
        max_length=100,
        unique=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="注文ID",
    )  # 人間が読みやすいID (任意)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="注文者",
    )  # ユーザーが削除されても注文は残す
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="注文日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    # --- 配送先情報 ---
    # (Profileモデルに配送先を複数持たせるか、注文ごとに直接入力するか設計による)
    # ここでは注文ごとに直接入力する例
    shipping_full_name = models.CharField(max_length=100, verbose_name="配送先氏名")
    shipping_postal_code = models.CharField(
        max_length=10, verbose_name="配送先郵便番号"
    )
    shipping_prefecture = models.CharField(max_length=50, verbose_name="配送先都道府県")
    shipping_city = models.CharField(max_length=100, verbose_name="配送先市区町村")
    shipping_address1 = models.CharField(
        max_length=255, verbose_name="配送先住所1(番地など)"
    )
    shipping_address2 = models.CharField(
        max_length=255, blank=True, verbose_name="配送先住所2(建物名など)"
    )
    shipping_phone_number = models.CharField(
        max_length=20, verbose_name="配送先電話番号"
    )

    # --- 支払い情報 ---
    total_amount = models.DecimalField(
        max_digits=10, decimal_places=0, default=0, verbose_name="合計金額(税抜)"
    )  # 税計算は別途
    # shipping_fee = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name='送料')
    # final_total_amount = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='最終合計金額(税込・送料込)')
    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        null=True,
        verbose_name="支払い方法",
    )
    payment_status = models.CharField(
        max_length=20,  # 必要なら長さを調整
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_PENDING,  # 定数を使う
        verbose_name="支払い状況",
    )
    # payment_intent_id = models.CharField(max_length=255, blank=True, null=True, verbose_name='決済ID (Stripeなど)') # 決済サービス連携用

    # --- 注文ステータス ---
    order_status = models.CharField(
        max_length=20,  # 必要なら長さを調整
        choices=ORDER_STATUS_CHOICES,
        default=ORDER_STATUS_PENDING,  # 定数を使う
        verbose_name="注文状況",
    )

    notes = models.TextField(blank=True, verbose_name="備考欄")  # ユーザーからの備考

    class Meta:
        verbose_name = "注文"
        verbose_name_plural = "注文"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Order {self.order_id} by {self.user.username if self.user else 'Guest'}"
        )

    # def calculate_total(self):
    #     # OrderItem の合計金額を計算するメソッド (任意)
    #     pass


class OrderItem(models.Model):
    """注文商品モデル"""

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="注文"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="商品"
    )  # 商品が削除されても注文履歴は残す
    product_name = models.CharField(
        max_length=255, verbose_name="商品名(注文時)"
    )  # 商品名変更に備えて記録
    price_at_purchase = models.DecimalField(
        max_digits=10, decimal_places=0, verbose_name="購入時単価"
    )  # 価格変動に備えて記録
    quantity = models.PositiveIntegerField(default=1, verbose_name="数量")
    # subtotal = models.DecimalField(max_digits=10, decimal_places=0, verbose_name='小計') # price * quantity

    class Meta:
        verbose_name = "注文商品"
        verbose_name_plural = "注文商品"

    def __str__(self):
        return f"{self.quantity} x {self.product_name or 'Unknown Product'} for Order {self.order.order_id}"

    # def get_subtotal(self):
    #     return self.price_at_purchase * self.quantity
