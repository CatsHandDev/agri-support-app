from rest_framework import serializers
from .models import Product
from app.accounts.serializers import UserSerializer # 生産者情報を表示するため
# from apps.accounts.serializers import UserSerializer # 不要になるかも

class ProductSerializer(serializers.ModelSerializer):
    producer_username = serializers.CharField(source='producer.username', read_only=True) # 読み取り時にユーザー名を表示

    # 選択肢フィールドの表示名を返す
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    cultivation_method_display = serializers.CharField(source='get_cultivation_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'producer_username',
            'name',
            'description',
            'category',
            'price',
            'quantity',
            'unit',
            'unit_display',
            'image',
            'standard',
            'cultivation_method',
            'cultivation_method_display',
            'harvest_時期',
            'shipping_available_時期',
            'allergy_info',
            'storage_method',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'producer_username',
            'unit_display',
            'cultivation_method_display',
            'status_display',
        ]