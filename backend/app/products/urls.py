# backend/apps/products/urls.py
from django.urls import path, include # type: ignore
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

app_name = "products"

# ViewSet の基本的な CRUD 用ルーター
router = DefaultRouter()
router.register(r"", ProductViewSet, basename="product")

# ViewSet からカスタムアクションのビューを取得
product_change_status = ProductViewSet.as_view(
    {"post": "change_status"}  # POST メソッドを change_status アクションにマッピング
)

urlpatterns = [
    # 基本的な CRUD の URL をインクルード
    path("", include(router.urls)),
    # ★ カスタムアクションの URL を明示的に追加 ★
    # /api/products/{pk}/change-status/ というパスを定義
    path(
        "<int:pk>/change-status/", product_change_status, name="product-change-status"
    ),
]
