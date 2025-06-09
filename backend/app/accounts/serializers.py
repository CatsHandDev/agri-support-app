from django.contrib.auth.models import User  # type: ignore # Django標準Userを使用

# from django.contrib.auth import get_user_model # カスタムUserモデルを使う場合
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password  # type: ignore
from django.core.exceptions import ValidationError  # type: ignore
from app.profiles.models import Profile

# User = get_user_model() # カスタムUserモデルを使う場合

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    is_producer = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "username",
            "password",
            "password2",
            "email",
            "first_name",
            "last_name",
            "is_producer",
        )
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        user.set_password(validated_data["password"])  # パスワードをハッシュ化
        user.save()
        return user

    def get_is_producer(self, obj):
        # User オブジェクト (obj) に紐づく Profile を取得し、is_producer を返す
        try:
            # obj.profile は Profile モデルの related_name='profile' に依存
            return obj.profile.is_producer
        except AttributeError:  # User に profile がない場合 (ほぼないはず)
            return False
        except (
            User.profile.RelatedObjectDoesNotExist
        ):  # Profile オブジェクトが存在しない場合 (シグナルがあれば通常は存在する)
            return False
        except Exception as e:  # 念のため他のエラーもキャッチ
            print(f"Error getting is_producer for user {obj.username}: {e}")
            return False


class UserSerializer(serializers.ModelSerializer):
    # is_producer フィールドを SerializerMethodField として定義
    is_producer = serializers.SerializerMethodField(read_only=True)  # read_only を明示

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_producer",
        )

    def get_is_producer(self, obj: User) -> bool:
        """
        User オブジェクトに紐づく Profile を取得し、is_producer フラグを返す。
        Profile が存在しない場合は False を返す。
        """
        try:
            # related_name が 'profile' であることを想定
            if hasattr(obj, "profile") and obj.profile is not None:
                return obj.profile.is_producer
            else:
                # User作成と同時にProfileが作られるはずだが、念のため存在しないケース
                print(f"Warning: Profile not found for user {obj.username}")
                return False
        except Exception as e:
            # 予期せぬエラーの場合も False を返し、ログを出力
            print(f"Error getting is_producer for user {obj.username}: {e}")
            return False

# ユーザー詳細情報更新用シリアライザ
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name'] # 更新を許可するフィールド
        # email の更新はより慎重な扱いが必要 (例: 確認メール送信) なので一旦含めない
        # username の変更も影響が大きいので通常は許可しない

# ユーザー詳細情報取得・更新用シリアライザ (GET, PATCH 用)
class UserDetailSerializer(serializers.ModelSerializer):
    # Profile から is_producer を読み取り専用で追加
    is_producer = serializers.SerializerMethodField(read_only=True)
    # 必要なら Profile の他の情報もここに含めることができる
    # profile = ProfileSerializer(read_only=True) # Profile全体をネストする場合

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_producer',
            # 'profile',
        ]
        read_only_fields = ['id', 'username', 'email', 'is_producer'] # username, email は読み取り専用

    def get_is_producer(self, obj: User) -> bool:
        try:
            return obj.profile.is_producer
        except Profile.DoesNotExist: # User に Profile がまだない場合
            return False
        except AttributeError: # obj に profile 属性がない場合 (シグナル未作成など)
            return False