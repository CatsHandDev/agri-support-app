from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
import logging  # logging モジュールをインポート
from .filters import ProductFilter
from rest_framework.pagination import PageNumberPagination

logger = logging.getLogger(__name__)  # ロガーを取得


class StandardResultsSetPagination(PageNumberPagination):  # クラスを定義
    page_size = 12  # 1ページあたりのデフォルト件数
    page_size_query_param = (
        "page_size"  # クライアントが件数を指定できるようにするパラメータ名
    )
    max_page_size = 100  # 1ページあたりの最大件数


class IsProducerOrReadOnly(permissions.BasePermission):
    """
    オブジェクトの所有者（生産者）のみ書き込みを許可するカスタム権限。
    読み取りは誰でも許可。
    """

    def has_object_permission(self, request, view, obj):
        # 読み取りリクエスト (GET, HEAD, OPTIONS) は常に許可
        if request.method in permissions.SAFE_METHODS:
            return True

        # 書き込みリクエストは、オブジェクトの producer とリクエストユーザーが一致する場合のみ許可
        # obj.producer が存在することを前提とする
        return obj.producer == request.user


class ProductViewSet(viewsets.ModelViewSet):
    """
    商品 API 用 ViewSet
    一覧取得 (list), 詳細取得 (retrieve), 作成 (create),
    更新 (update, partial_update), 削除 (destroy) を提供
    """

    queryset = Product.objects.all()  # 全ての商品を対象とし、権限でフィルタ
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsProducerOrReadOnly]

    # フィルタリング設定
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ProductFilter

    search_fields = ["name", "description", "category"]  # キーワード検索対象
    ordering_fields = ["price", "created_at", "updated_at"]  # 並び替え可能フィールド
    ordering = ["-created_at"]  # デフォルトの並び順

    def get_queryset(self):
        """
        認証状態やリクエスト内容に応じて表示するデータを調整
        """
        user = self.request.user
        owner_param = self.request.query_params.get("owner")

        base_queryset = Product.objects.all().select_related(
            "producer"
        )  # ベースは全件+関連取得

        if self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
            "change_status",
        ]:
            # 詳細系は権限チェックに任せるため、ここではフィルタしない
            # (ただし、パフォーマンスのために producer で絞るのもあり)
            # if user.is_authenticated: return base_queryset.filter(producer=user)
            return base_queryset
        elif self.action == "list" and owner_param == "me" and user.is_authenticated:
            # 自分の商品一覧
            return base_queryset.filter(producer=user)
        else:
            # デフォルトの商品一覧 (販売中)
            return base_queryset.filter(status=Product.STATUS_ACTIVE)

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise permissions.PermissionDenied("商品を作成するにはログインが必要です。")
        # デフォルトステータスはモデルで 'draft' に設定済み

        image_file = serializer.validated_data.get("image")
        logger.info(
            f"[perform_create PRE-SAVE] Attempting save. User: {self.request.user.username}. Has Image: {bool(image_file)}. Image Name: {image_file.name if image_file else 'N/A'}"
        )

        try:
            # ★★★ 保存実行 ★★★
            instance = serializer.save(producer=self.request.user)
            # ★★★ 保存実行 ★★★

            # ★★★ 成功ログ ★★★
            logger.info(
                f"[perform_create POST-SAVE] SUCCESS! Product ID: {instance.id}"
            )
            if instance.image:
                logger.info(
                    f"[perform_create POST-SAVE] Image Name (DB): {instance.image.name}"
                )  # DB上の相対パス
                try:
                    logger.info(
                        f"[perform_create POST-SAVE] Image Path (FS): {instance.image.path}"
                    )  # ファイルシステムの絶対パス
                    logger.info(
                        f"[perform_create POST-SAVE] Image URL: {instance.image.url}"
                    )
                except Exception as path_url_error:
                    logger.warning(
                        f"[perform_create POST-SAVE] Could not get image path/url: {path_url_error}"
                    )
                else:
                    logger.info("[perform_create POST-SAVE] No image was saved.")
                # ★★★ ここまで ★★★

            serializer.save(producer=self.request.user)

            # ★ 保存成功時のログ ★
            instance = serializer.instance
            if instance.image:
                print(
                    f"[perform_create] SUCCESS: Image saved for Product ID {instance.id} at {instance.image.path}"
                )
            else:
                print(
                    f"[perform_create] SUCCESS: Product ID {instance.id} created (No image uploaded)."
                )

        except Exception as e:
            # ★★★ 保存失敗時のエラーログ ★★★
            logger.error(
                f"[perform_create SAVE ERROR] Failed to save product for user {self.request.user.username}.",
                exc_info=True,
            )  # exc_info=True でトレースバックも記録
            # エラーを再発生させるか、DRFのエラーハンドリングに任せる
            raise

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsProducerOrReadOnly],
        url_path="change-status",
    )
    def change_status(self, request, pk=None):
        """商品のステータスを変更する"""
        product = self.get_object()  # 対象の商品を取得 (権限チェック)
        new_status = request.data.get(
            "status"
        )  # リクエストボディから新しいステータスを取得

        # 新しいステータスが有効な選択肢かチェック (任意だが推奨)
        valid_statuses = [choice[0] for choice in Product.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": "無効なステータスです。"}, status=status.HTTP_400_BAD_REQUEST
            )

        # (オプション) ステータス遷移のロジックをここに追加可能
        # 例: 'draft' から 'active' にしか変更できない、など

        product.status = new_status
        product.save()
        serializer = self.get_serializer(product)
        return Response(serializer.data)
