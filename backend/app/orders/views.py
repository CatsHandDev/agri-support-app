# backend/app/orders/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from app.products.views import StandardResultsSetPagination
from .models import Order, OrderItem
from .serializers import OrderSerializer
from app.profiles.models import Profile
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework.pagination import PageNumberPagination
from django.core.mail import send_mail  # type: ignore # ★ メール送信のため
from django.template.loader import render_to_string  # type: ignore # ★ テンプレートからメール本文生成
from django.conf import settings  # type: ignore # ★ DEFAULT_FROM_EMAIL を使うため
from django.contrib.auth import get_user_model # type: ignore

class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class OrderViewSet(viewsets.ModelViewSet):
    """
    注文 API
    - list: 自分の注文履歴
    - retrieve: 自分の特定の注文詳細
    - create: 新しい注文を作成
    (update, destroy は通常制限される)
    """

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須
    pagination_class = StandardResultsSetPagination
    # フィルタリングと並び替えも設定
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["created_at", "total_amount", "order_status"]
    ordering = ["-created_at"]  # デフォルトの並び順
    lookup_field = "order_id"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        user = self.request.user
        print(
            f"[ProducerOrderViewSet get_queryset] START - User: {user.username}, IsAuth: {user.is_authenticated}"
        )
        try:
            if not user.profile.is_producer:
                print("[ProducerOrderViewSet get_queryset] User is NOT a producer.")
                return Order.objects.none()
        except Profile.DoesNotExist:
            print("[ProducerOrderViewSet get_queryset] Profile DOES NOT exist.")
            return Order.objects.none()
        except AttributeError:
            print(
                "[ProducerOrderViewSet get_queryset] User has no 'profile' attribute."
            )
            return Order.objects.none()

        print(
            f"[ProducerOrderViewSet get_queryset] User IS a producer. Filtering orders..."
        )
        queryset = (
            Order.objects.filter(items__product__producer=user)
            .distinct()
            .prefetch_related("items", "items__product", "user")
        )
        print(
            f"[ProducerOrderViewSet get_queryset] END - Found orders: {queryset.count()}"
        )
        return queryset

    def get_serializer_context(self):
        # シリアライザにリクエスト情報を渡す (create で user を使うため)
        return {"request": self.request}

    def perform_create(self, serializer):
        # user はシリアライザの create メソッド内で context から取得して設定
        serializer.save()  # シリアライザの create が呼ばれる

    # 注文後の更新や削除は通常、管理者や特定の条件下でのみ許可される
    # なので、デフォルトの update, partial_update, destroy を無効化または制限する
    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


# 生産者向け注文管理 ViewSet
class ProducerOrderViewSet(viewsets.ModelViewSet):  # 基本は読み取りと部分更新
    lookup_field = "order_id"
    lookup_url_kwarg = "order_id"
    serializer_class = OrderSerializer  # 同じシリアライザを流用 (必要なら専用を作成)
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        filters.SearchFilter,
    ]
    ordering_fields = ["created_at", "total_amount", "order_status"]
    ordering = ["-created_at"]
    filterset_fields = ["order_status", "payment_status"]
    search_fields = [
        "order_id",
        "user__username",
        "shipping_full_name",
        "items__product_name",
    ]

    def get_queryset(self):  # ★このメソッド定義のインデント
        user = self.request.user
        print(
            f"[ProducerOrderViewSet get_queryset] User: {user.username}, IsAuth: {user.is_authenticated}"
        )
        try:
            if not user.profile.is_producer:
                print("[ProducerOrderViewSet get_queryset] User is not a producer.")
                return Order.objects.none()
        except Profile.DoesNotExist:
            print(
                "[ProducerOrderViewSet get_queryset] Profile does not exist for user."
            )
            return Order.objects.none()
        except AttributeError:  # user に profile がない場合も考慮
            print("[ProducerOrderViewSet get_queryset] User has no profile attribute.")
            return Order.objects.none()

        queryset = (
            Order.objects.filter(items__product__producer=user)
            .distinct()
            .prefetch_related("items", "items__product", "user")
        )
        print(
            f"[ProducerOrderViewSet get_queryset] Found orders for producer: {queryset.count()}"
        )
        # ↓↓↓ この return が get_queryset メソッド内に正しくインデントされていること ↓↓↓
        return queryset

    def get_serializer_context(self):
        return {"request": self.request}

    # ★ ステータス更新用の partial_update を許可 ★
    # ModelViewSet はデフォルトで partial_update を持つが、フィールドを制限したい場合は
    # 専用のシリアライザを用意するか、ここで処理を記述
    def partial_update(self, request, *args, **kwargs):
        order_instance = self.get_object()
        new_status_from_request = request.data.get(
            "order_status"
        )  # ★ フロントからのキー名と一致？

        print(
            f"[Producer PATCH] Order ID: {order_instance.order_id}, Current Status: {order_instance.order_status}, Received New Status: {new_status_from_request}"
        )  # ★ ログ

        if not new_status_from_request:
            return Response(
                {"detail": "order_status is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status_from_request not in [
            choice[0] for choice in Order.ORDER_STATUS_CHOICES
        ]:
            return Response(
                {"order_status": ["無効なステータスです。"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # データベースの更新処理
        # シリアライザ経由で更新
        serializer = self.get_serializer(
            order_instance, data={"order_status": new_status_from_request}, partial=True
        )
        if serializer.is_valid(raise_exception=True):
            serializer.save()  # ★ これでDBが更新される
            print(
                f"[Producer PATCH] Status updated to: {serializer.data.get('order_status')}"
            )
            return Response(serializer.data)

    # create, update (フル), destroy は許可しない
    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # 発送完了通知アクション
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="mark-shipped",
    )
    def mark_as_shipped(
        self, request, order_id=None
    ):  # lookup_field が order_id なので order_id で受け取る
        order = self.get_object()

        # ログインユーザーがこの注文の商品の生産者であることを確認 (より厳密に)
        # (get_queryset で既に絞り込んでいるが、念のためオブジェクトレベルでも確認可能)
        if not OrderItem.objects.filter(
            order=order, product__producer=request.user
        ).exists():
            return Response(
                {"detail": "この注文に対する操作権限がありません。"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.order_status == Order.STATUS_SHIPPED:
            return Response(
                {"detail": "この注文は既に発送済みです。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if (
            order.order_status == Order.STATUS_COMPLETED
            or order.order_status == Order.STATUS_CANCELLED
        ):
            return Response(
                {
                    "detail": "完了またはキャンセル済みの注文のステータスは変更できません。"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. 注文ステータスを「発送済み」に更新
        order.order_status = Order.STATUS_SHIPPED
        order.save(update_fields=["order_status"])
        print(f"Order {order.order_id} marked as SHIPPED by {request.user.username}")

        # 2. 注文者にメールを送信
        if (
            order.user and order.user.email
        ):  # 注文者にユーザーとメールアドレスがある場合
            try:
                subject = render_to_string(
                    "orders/email/shipment_notification_subject.txt", {"order": order}
                ).strip()
                # strip() で改行を除去
                message_context = {
                    "user": order.user,  # 注文者ユーザーオブジェクト
                    "order": order,  # 注文オブジェクト
                    # 他にテンプレートで使いたい変数があれば追加
                }
                message_txt = render_to_string(
                    "orders/email/shipment_notification_body.txt", message_context
                )
                # HTMLメールも送信する場合
                # message_html = render_to_string('orders/email/shipment_notification_body.html', message_context)

                send_mail(
                    subject,
                    message_txt,
                    settings.DEFAULT_FROM_EMAIL,  # 送信元
                    [order.user.email],  # 送信先リスト
                    # html_message=message_html, # HTMLメールの場合
                    fail_silently=False,  # エラー時に例外を発生させる
                )
                print(
                    f"Shipment notification email sent to {order.user.email} for order {order.order_id}"
                )
            except Exception as e:
                # メール送信失敗はログに残すが、APIとしては成功として返すことも検討
                print(f"ERROR sending shipment email for order {order.order_id}: {e}")
                # return Response({'detail': 'ステータスは更新されましたが、メール送信に失敗しました。'}, status=status.HTTP_207_MULTI_STATUS)

        serializer = self.get_serializer(order)  # 更新後の注文情報を返す
        return Response(serializer.data, status=status.HTTP_200_OK)
