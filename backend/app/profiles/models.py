from django.db import models  # type: ignore
from django.conf import settings  # type: ignore
from django.db.models.signals import post_save  # type: ignore # User作成時にProfileも自動作成するため
from django.dispatch import receiver  # type: ignore # post_save シグナルを受け取るため
from django.db import IntegrityError  # type: ignore

User = settings.AUTH_USER_MODEL


class Profile(models.Model):
    """
    ユーザープロフィールモデル (主に生産者向け情報を想定)
    User モデルと 1対1 で紐づく
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile", verbose_name="ユーザー"
    )
    farm_name = models.CharField(
        max_length=255, blank=True, verbose_name="農園名/事業者名"
    )
    location_prefecture = models.CharField(
        max_length=50, blank=True, verbose_name="所在地 (都道府県)"
    )
    location_city = models.CharField(
        max_length=100, blank=True, verbose_name="所在地 (市区町村)"
    )
    # location_address = models.CharField(max_length=255, blank=True, verbose_name='所在地 (番地以降)') # 必要なら
    bio = models.TextField(blank=True, verbose_name="自己紹介/こだわり")
    image = models.ImageField(
        upload_to="profiles/", blank=True, null=True, verbose_name="プロフィール画像"
    )  # Pillow が必要
    website_url = models.URLField(blank=True, verbose_name="ウェブサイトURL")
    phone_number = models.CharField(
        max_length=20, blank=True, verbose_name="電話番号"
    )  # 必要なら
    certification_info = models.TextField(
        blank=True, verbose_name="認証情報"
    )  # 例:有機JAS認定番号など
    is_producer = models.BooleanField(
        default=False, verbose_name="生産者フラグ"
    )  # このユーザーが生産者かどうか (簡易的なロール管理)
    last_name_kana = models.CharField(
        max_length=100, blank=True, verbose_name="姓 (カナ)"
    )
    first_name_kana = models.CharField(
        max_length=100, blank=True, verbose_name="名 (カナ)"
    )
    postal_code = models.CharField(
        max_length=10, blank=True, verbose_name="郵便番号"
    )  # 例: 123-4567 or 1234567
    prefecture = models.CharField(
        max_length=50, blank=True, verbose_name="都道府県"
    )  # ユーザー自身の住所
    city = models.CharField(max_length=100, blank=True, verbose_name="市区町村")
    address1 = models.CharField(max_length=255, blank=True, verbose_name="番地など")
    address2 = models.CharField(
        max_length=255, blank=True, verbose_name="建物名・部屋番号など"
    )
    phone_number_user = models.CharField(
        max_length=20, blank=True, verbose_name="電話番号 (ユーザー連絡用)"
    )  # 生産者の電話番号と区別
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        verbose_name = "プロフィール"
        verbose_name_plural = "プロフィール"

    def __str__(self):
        return f"{self.user.username} のプロフィール"


# User モデルが作成されたときに、対応する Profile も自動的に作成するシグナルハンドラ
# これにより、既存ユーザー・新規ユーザーともに必ず Profile を持つようになる
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        print(
            f"[Signal] User created with ID: {instance.id}. Trying to create Profile."
        )
        try:
            # 念のため、この時点で User が DB に存在するか確認
            user_exists = User.objects.filter(id=instance.id).exists()
            print(
                f"[Signal] Does User ID {instance.id} exist in DB before Profile create? {user_exists}"
            )

            # Profile 作成実行
            profile, profile_created = Profile.objects.get_or_create(
                user=instance,
                # defaults={} # get_or_create なので defaults は通常不要だが、明示しても良い
            )

            if profile_created:
                print(f"[Signal] Profile created for user ID: {instance.id}")
            else:
                # get_or_create で既存が見つかった場合 (通常は created=True の時は来ないはず)
                print(f"[Signal] Profile already existed for user ID: {instance.id}")

        except IntegrityError as e:
            print(
                f"[Signal] !!! IntegrityError creating Profile for User ID {instance.id}: {e}"
            )
            # ここでエラーの詳細を出力
        except Exception as e:
            print(
                f"[Signal] !!! Unexpected Error creating Profile for User ID {instance.id}: {e}"
            )


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # User が更新されたときに Profile も念のため保存する (必須ではない)
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        # もし何らかの理由で Profile がなければ作成
        Profile.objects.create(user=instance)
