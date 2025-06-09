# backend/app/orders/serializers.py
from rest_framework import serializers
from django.db import transaction  # type: ignore
from .models import Order, OrderItem
from app.products.models import Product
from app.products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)  # 詳細表示用
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(
            status=Product.STATUS_ACTIVE
        ),  # 販売中の商品のみを対象にする
        source="product",  # ★ モデルの product フィールドにマッピング
        write_only=True,  # ★ 作成時のみ使用
    )
    # product_name = serializers.CharField(
    #     read_only=True, source="product.name"
    # )  # ★ 読み取り時に商品名を表示
    # price_at_purchase = serializers.DecimalField(
    #     max_digits=10, decimal_places=0, read_only=True
    # )  # ★ 読み取り専用

    class Meta:
        model = OrderItem
        # product_name, price_at_purchase は作成時に自動設定するので fields には含めないことが多い
        fields = [
            "id",
            "product",
            "product_id",
            "product_name",
            "quantity",
            "price_at_purchase",
        ]
        read_only_fields = [
            "id",
            "product",
            "product_name",
            "price_at_purchase",
        ]  # 読み取り専用にする


class OrderSerializer(serializers.ModelSerializer):
    # ネストした OrderItem を書き込み可能にする
    items = OrderItemSerializer(many=True)  # ★ ネストした書き込み用
    user_username = serializers.CharField(
        source="user.username", read_only=True, allow_null=True
    )  # ★ 読み取り用

    class Meta:
        model = Order
        fields = [
            "id",
            "order_id",
            "user_username",
            "created_at",
            "updated_at",
            "shipping_full_name",
            "shipping_postal_code",
            "shipping_prefecture",
            "shipping_city",
            "shipping_address1",
            "shipping_address2",
            "shipping_phone_number",
            "total_amount",
            "payment_method",
            "payment_status",
            "order_status",
            "notes",
            "items",  # ネストしたアイテム
        ]
        # user は作成時に自動設定するので、リクエストボディからは不要
        read_only_fields = [
            "id",
            "order_id",
            "user_username",
            "created_at",
            "updated_at",
            "total_amount",
            "payment_status",
        ]
        # total_amount, payment_status, はサーバー側で制御

    def create(self, validated_data):
        items_data = validated_data.pop("items")  # ネストされた items データを取り出す
        user = self.context["request"].user  # View から渡された request context を使う

        # トランザクション内で Order と OrderItem を作成
        with transaction.atomic():
            # Order オブジェクトを作成 (user と配送先情報など)
            # total_amount は後で計算するので、モデルに default が設定されていること
            order = Order.objects.create(user=user, **validated_data)
            print(
                f"[OrderSerializer Create] Order created (ID: {order.id}, OrderID: {order.order_id})"
            )

            calculated_total_amount = 0
            order_items_to_create = []

            for item_data in items_data:
                product_instance = item_data[
                    "product"
                ]  # OrderItemSerializer の source='product' で Product インスタンスが入る
                quantity_ordered = item_data["quantity"]

                # 在庫チェック (より厳密なものは別途)
                if product_instance.quantity < quantity_ordered:
                    raise serializers.ValidationError(
                        f"商品「{product_instance.name}」の在庫が不足しています。"
                    )

                order_items_to_create.append(
                    OrderItem(
                        order=order,
                        product=product_instance,
                        product_name=product_instance.name,  # 注文時の商品名を記録
                        price_at_purchase=product_instance.price,  # 注文時の価格を記録
                        quantity=quantity_ordered,
                    )
                )
                calculated_total_amount += product_instance.price * quantity_ordered

                # 在庫を減らす (ここで実行するか、シグナルなどを使う)
                # product_instance.quantity -= quantity_ordered
                # product_instance.save(update_fields=['quantity'])

            # OrderItem をバルクで作成
            OrderItem.objects.bulk_create(order_items_to_create)
            print(
                f"[OrderSerializer Create] {len(order_items_to_create)} OrderItems created for Order ID: {order.id}"
            )

            # 計算した合計金額と、初期の支払い・注文ステータスを Order に設定して保存
            order.total_amount = calculated_total_amount
            # 支払い方法に応じて初期ステータスを設定 (例)
            if validated_data.get("payment_method") == "bank_transfer":
                order.payment_status = Order.PAYMENT_STATUS_CHOICES[0][0]  # 'pending'
                order.order_status = Order.ORDER_STATUS_CHOICES[0][0]  # 'pending'
            else:
                order.payment_status = Order.PAYMENT_STATUS_CHOICES[0][0]  # 'pending'
                order.order_status = Order.ORDER_STATUS_CHOICES[0][0]  # 'pending'
            order.save(update_fields=["total_amount", "payment_status", "order_status"])
            print(
                f"[OrderSerializer Create] Order ID {order.id} finalized. Total: {order.total_amount}"
            )

        return order
