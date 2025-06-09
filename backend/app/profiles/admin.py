from django.contrib import admin # type: ignore
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # type: ignore
from django.contrib.auth.models import User # type: ignore
from .models import Profile

# Profile を User 編集画面内にインラインで表示するための設定
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'プロフィール'
    # 必要に応じて表示するフィールドを制限 (fields = ('farm_name', 'is_producer', ...))

# デフォルトの UserAdmin を拡張して ProfileInline を追加
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

# デフォルトの User モデルの登録を解除し、拡張した UserAdmin で再登録
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# (オプション) Profile モデル自体も管理画面に表示する場合
# @admin.register(Profile)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'farm_name', 'is_producer', 'updated_at')
#     list_filter = ('is_producer',)
#     search_fields = ('user__username', 'farm_name')