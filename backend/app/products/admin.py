# backend/app/products/admin.py
from django.contrib import admin  # type: ignore
from .models import Product  # 同じディレクトリの models.py から Product をインポート


# Product モデルを管理画面に登録するための設定クラス (カスタマイズ可能)
@admin.register(Product)  # @admin.register デコレータを使う方法 (推奨)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "producer",
        "price",
        "status",
        "updated_at",
    )  # 一覧に表示するフィールド
    list_filter = ("status", "producer", "category")  # 右側に表示されるフィルター
    search_fields = (
        "name",
        "description",
        "producer__username",
    )  # 上部に表示される検索バーの対象
    list_editable = ("price", "status")  # 一覧画面で直接編集可能なフィールド (任意)
    list_per_page = 20  # 1ページあたりの表示件数
    # readonly_fields = ('created_at', 'updated_at') # 詳細画面で読み取り専用にするフィールド (任意)
    # fieldsets や field などで詳細編集画面のレイアウトをカスタマイズすることも可能


# --- または、シンプルな登録方法 ---
# admin.site.register(Product)
