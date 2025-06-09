from django.urls import path  # type: ignore
from .views import RegisterView, UserMeView  # views.py からインポート
from rest_framework_simplejwt.views import (  # type: ignore
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("me/", UserMeView.as_view(), name="user_detail"),
]
