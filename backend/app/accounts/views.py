from django.contrib.auth.models import User  # type: ignore

# from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer
from .serializers import RegisterSerializer, UserDetailSerializer, UserUpdateSerializer

# User = get_user_model() # カスタムUserモデルを使う場合


# ユーザー登録API (誰でもアクセス可能)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)  # 登録は誰でも許可
    serializer_class = RegisterSerializer

# ログインユーザー情報取得・更新API
class UserMeView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)  # 認証必須

    def get_object(self):
        return self.request.user  # 自分自身の情報を返す

    def get_serializer_class(self):
        if self.request.method == "GET":
            return UserDetailSerializer  # GET時は詳細表示用
        return UserUpdateSerializer  # PATCH/PUT 時は更新用
