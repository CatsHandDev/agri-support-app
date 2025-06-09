from django.db import models  # type: ignore
from django.conf import settings  # type: ignore # settings.AUTH_USER_MODEL を参照するため

# settings.AUTH_USER_MODEL を参照してユーザーモデルを取得
# (カスタムユーザーモデルに対応しやすいため推奨)
User = settings.AUTH_USER_MODEL


class Product(models.Model):
    """商品モデル"""

    # ステータスの選択肢を追加
    STATUS_DRAFT = "draft"
    STATUS_PENDING = "pending"  # 審査中 (必要なら)
    STATUS_ACTIVE = "active"  # 販売中 (公開)
    STATUS_INACTIVE = "inactive"  # 販売停止
    STATUS_CHOICES = [
        (STATUS_DRAFT, "下書き"),
        (STATUS_PENDING, "審査中"),
        (STATUS_ACTIVE, "販売中"),
        (STATUS_INACTIVE, "販売停止"),
    ]
    # 単位の選択肢 (例)
    UNIT_CHOICES = [
        ("kg", "キログラム"),
        ("g", "グラム"),
        ("ko", "個"),
        ("fukuro", "袋"),
        ("hako", "箱"),
        ("taba", "束"),
        # 必要に応じて追加
    ]
    # 栽培方法の選択肢 (例)
    CULTIVATION_CHOICES = [
        ("conventional", "慣行栽培"),
        ("special", "特別栽培"),
        ("organic", "有機栽培 (JAS認証なし)"),
        ("organic_jas", "有機栽培 (JAS認証あり)"),
        ("natural", "自然栽培"),
        # 必要に応じて追加
    ]

    producer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="products", verbose_name="生産者"
    )
    name = models.CharField(max_length=255, verbose_name="商品名")
    description = models.TextField(verbose_name="商品説明")
    category = models.CharField(
        max_length=100, blank=True, verbose_name="カテゴリ"
    )  # 例: 野菜, 果物, 米など
    price = models.DecimalField(
        max_digits=10, decimal_places=0, verbose_name="価格 (円)"
    )  # 税抜/税込は別途考慮 or 説明に記載
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="数量"
    )  # 例: 1.5 kg, 10 個
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, verbose_name="単位")
    image = models.ImageField(
        upload_to="products/", blank=True, null=True, verbose_name="商品画像"
    )  # Pillow が必要 pip install Pillow
    # video = models.FileField(upload_to='products_video/', blank=True, null=True, verbose_name='商品動画') # 必要であれば
    standard = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="規格"
    )  # 例: Lサイズ, A品, 訳あり
    cultivation_method = models.CharField(
        max_length=50, choices=CULTIVATION_CHOICES, blank=True, verbose_name="栽培方法"
    )
    harvest_時期 = models.CharField(
        max_length=100, blank=True, verbose_name="収穫時期"
    )  # 例: 7月上旬～8月中旬
    shipping_available_時期 = models.CharField(
        max_length=100, blank=True, verbose_name="出荷可能時期"
    )  # 例: 注文後3日以内
    allergy_info = models.CharField(
        max_length=255, blank=True, null=True, verbose_name="アレルギー情報"
    )
    storage_method = models.CharField(
        max_length=255, blank=True, verbose_name="保存方法"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,  # デフォルトステータスを下書きに
        db_index=True,  # 検索・フィルタのためにインデックスを張る
        verbose_name="ステータス",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        verbose_name = "商品"
        verbose_name_plural = "商品"
        ordering = ["-created_at"]  # 新しい順に並べる

    def __str__(self):
        return f"{self.name} ({self.producer.username})"

    # 公開中かどうかを判定するプロパティ
    @property
    def is_active(self):
        return self.status == self.STATUS_ACTIVE
