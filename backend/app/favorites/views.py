# backend/app/favorites/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import FavoriteProduct
from .serializers import FavoriteProductSerializer
from app.products.models import Product  # Product モデルをインポート


class FavoriteProductViewSet(viewsets.ModelViewSet):
    """
    お気に入り商品 API (自分のもののみ操作)
    """

    serializer_class = FavoriteProductSerializer
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須

    def get_queryset(self):
        # 常に自分の FavoriteProduct のみを返す
        return FavoriteProduct.objects.filter(user=self.request.user).select_related(
            "product", "product__producer"
        )  # N+1 対策

    def perform_create(self, serializer):
        # リクエストユーザーを自動で設定
        user = self.request.user
        product_id = serializer.validated_data.get("product_id")

        # Product が存在するか確認 (任意だが推奨)
        try:
            product = Product.objects.get(
                id=product_id, status=Product.STATUS_ACTIVE
            )  # 販売中の商品のみお気に入り可能とする (任意)
        except Product.DoesNotExist:
            raise ValidationError({"product_id": "有効な商品が見つかりません。"})

        # 既に存在するか確認 (unique_together があるが、より親切なエラーを返す)
        if FavoriteProduct.objects.filter(user=user, product=product).exists():
            raise ValidationError(
                {"product_id": "この商品は既にお気に入り登録されています。"}
            )

        serializer.save(user=user, product=product)  # user と product を設定して保存

    # 削除は pk (FavoriteProduct の id) で行うのが ModelViewSet のデフォルト
    # もし商品 ID で削除したい場合は destroy をオーバーライドするかカスタムアクションを追加
    # 例: DELETE /api/favorites/products/by_product/{product_id}/
    # @action(detail=False, methods=['delete'], url_path='by_product/(?P<product_id>[0-9]+)')
    # def remove_by_product_id(self, request, product_id=None):
    #     user = request.user
    #     try:
    #         favorite = FavoriteProduct.objects.get(user=user, product_id=product_id)
    #         favorite.delete()
    #         return Response(status=status.HTTP_204_NO_CONTENT)
    #     except FavoriteProduct.DoesNotExist:
    #         return Response({'detail': 'お気に入りが見つかりません。'}, status=status.HTTP_404_NOT_FOUND)
