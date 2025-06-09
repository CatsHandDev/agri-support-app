from django.urls import path, include  # type: ignore
from rest_framework.routers import DefaultRouter
from .views import MyProfileView, ProfileViewSet
from .views import MyProfileView

app_name = "profiles"
# --- ViewSet 用のルーターを作成 ---
router = DefaultRouter()
# /api/profiles/ で ProfileViewSet の list, retrieve アクションにルーティング
router.register(r"", ProfileViewSet, basename="profile-list")

urlpatterns = [
    # /api/profiles/me/ で自分のプロフィールを取得(GET)・更新(PUT/PATCH)
    path("me/", MyProfileView.as_view(), name="my-profile"),
    # --- /api/profiles/ や /api/profiles/{pk}/ へのルーティングを追加 ---
    path("", include(router.urls)),
]
