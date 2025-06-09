# backend/app/products/filters.py
import django_filters  # type: ignore
from .models import Product
from django.db.models import Q  # type: ignore


class ProductFilter(django_filters.FilterSet):
    # --- 検索・絞り込みたいフィールドを定義 ---

    # 名前や説明での部分一致検索 (ViewSet の SearchFilter とは別に定義も可能)
    # search = django_filters.CharFilter(method='search_filter', label='Search')

    # カテゴリ (完全一致)
    category = django_filters.CharFilter(
        lookup_expr="iexact"
    )  # iexact: 大文字小文字無視

    # 価格帯 (範囲指定)
    min_price = django_filters.NumberFilter(
        field_name="price", lookup_expr="gte"
    )  # gte: Greater than or equal
    max_price = django_filters.NumberFilter(
        field_name="price", lookup_expr="lte"
    )  # lte: Less than or equal

    # 栽培方法 (複数選択可能にする場合 - MultipleChoiceFilter)
    cultivation_method = django_filters.MultipleChoiceFilter(
        choices=Product.CULTIVATION_CHOICES,
        # widget=django_filters.widgets.CheckboxSelectMultiple # DRFでは通常不要
    )

    # 生産者の所在地 (都道府県) (Profile モデルとの連携が必要)
    # producer_prefecture = django_filters.CharFilter(field_name='producer__profile__location_prefecture', lookup_expr='iexact')

    # 生産者ユーザー名での絞り込みを追加
    producer_username = django_filters.CharFilter(
        field_name="producer__username", lookup_expr="iexact"
    )

    # --- モデルと対象フィールドを指定 ---
    class Meta:
        model = Product
        fields = [
            "category",
            "min_price",
            "max_price",
            "cultivation_method",
            "producer_username",
            # 'producer_prefecture',
            # 他に status なども追加可能
        ]

    # (任意) キーワード検索用のカスタムメソッド
    # def search_filter(self, queryset, name, value):
    #     # 名前、説明、カテゴリ、生産者名などで OR 検索
    #     return queryset.filter(
    #         Q(name__icontains=value) |
    #         Q(description__icontains=value) |
    #         Q(category__icontains=value) |
    #         Q(producer__username__icontains=value) # 生産者名で検索
    #     ).distinct()
