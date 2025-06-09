from rest_framework import serializers
from .models import Profile
from app.accounts.serializers import UserSerializer  # User情報も一部含める場合


class ProfileSerializer(serializers.ModelSerializer):
    # user = UserSerializer(read_only=True) # ユーザー情報をネスト表示する場合
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(
        source="user.email", read_only=True
    )  # 読み取り専用で表示

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "email",
            "farm_name",
            "location_prefecture",
            "location_city",
            "bio",
            "image",
            "website_url",
            "phone_number",
            "certification_info",
            "is_producer",
            "last_name_kana",
            "first_name_kana",
            "postal_code",
            "prefecture",
            "city",
            "address1",
            "address2",
            "phone_number_user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "created_at",
            "updated_at",
            "is_producer",
        ]
