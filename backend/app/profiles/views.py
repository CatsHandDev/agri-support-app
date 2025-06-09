from rest_framework import generics, permissions, parsers, viewsets, filters
from .models import Profile
from .serializers import ProfileSerializer
from django.contrib.auth import get_user_model  # type: ignore
from rest_framework.pagination import PageNumberPagination  # ページネーションを使う場合
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore # フィルタリングを使う場合

# from django.contrib.auth import get_user_model # 必要なら
User = get_user_model()


# --- ページネーション設定 (任意) ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12  # 1ページあたりの表示件数
    page_size_query_param = "page_size"
    max_page_size = 100


# --- プロフィール一覧・詳細取得用 ViewSet ---
class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    # is_producer=True のプロフィールのみを取得、ユーザー情報も結合
    queryset = (
        Profile.objects.filter(is_producer=True)
        .select_related("user")
        .order_by("-created_at")
    )
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "user__username"
    lookup_url_kwarg = "username"

    # ページネーションとフィルタリングを追加
    pagination_class = StandardResultsSetPagination  # ページネーションを適用
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    # フィルター対象フィールドを定義 (FilterSet を別途作成しても良い)
    filterset_fields = ["location_prefecture", "location_city"]
    search_fields = ["farm_name", "user__username", "bio", "location_city"]  # 検索対象
    ordering_fields = ["created_at", "updated_at", "farm_name"]  # 並び替え
    ordering = ["-created_at"]  # デフォルトは新着順


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    ログインユーザー自身のプロフィールを取得・更新する API ビュー
    """

    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]  # ログイン必須
    parser_classes = [
        parsers.MultiPartParser,
        parsers.FormParser,
        parsers.JSONParser,
    ]  # 画像アップロード対応

    def get_object(self):
        # リクエストしてきたユーザーに紐づく Profile オブジェクトを返す
        # シグナルにより Profile は必ず存在するため、get() で取得
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    プロフィール一覧を取得するための ViewSet (読み取り専用)
    - is_producer=True のプロフィールのみを対象とする
    - デフォルトで作成日時の降順 (新しい順) で返す
    """

    # is_producer=True のプロフィールのみを取得
    queryset = (
        Profile.objects.filter(is_producer=True)
        .select_related("user")
        .order_by("-created_at")
    )
    serializer_class = ProfileSerializer
    permission_classes = [
        permissions.AllowAny
    ]  # プロフィール一覧は誰でも見れるように (変更可)
    # ページネーション設定 (必要なら)
    # pagination_class = YourPaginationClass
    # フィルタリング (必要なら)
    # filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # search_fields = ['farm_name', 'user__username', 'bio', 'location_city']
    # ordering_fields = ['created_at', 'updated_at', 'farm_name'] # 並び替えを許可する場合

    # lookup_field を設定
    # # URL の {pk} の代わりに {username} で検索できるようにする
    # User モデルの username フィールドを検索対象にする
    lookup_field = "user__username"
    lookup_url_kwarg = (
        "username"  # URL 内のパラメータ名 (デフォルトは lookup_field と同じだが明示)
    )

    # ページネーションやフィルタリングは必要なら追加
    # filter_backends = [filters.SearchFilter]
    # search_fields = ['farm_name', 'user__username', 'location_city']
