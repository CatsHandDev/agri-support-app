# backend/app/favorites/serializers.py
from rest_framework import serializers
from .models import FavoriteProduct
from app.products.serializers import ProductSerializer # 商品情報をネスト表示するため

class FavoriteProductSerializer(serializers.ModelSerializer):
    # product をネストして詳細情報を表示 (read_only=True を追加)
    product = ProductSerializer(read_only=True)
    # 作成用に product_id も受け付ける (write_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = FavoriteProduct
        # user はリクエストユーザーから取得するので fields には含めないことが多い
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'product', 'created_at'] # product は読み取り専用

    # def create(self, validated_data):
    #     # view 側で user を設定するのでここでは不要な場合が多い
    #     # user = self.context['request'].user
    #     # product_id = validated_data.pop('product_id')
    #     # product = Product.objects.get(id=product_id)
    #     # favorite, created = FavoriteProduct.objects.get_or_create(user=user, product=product, defaults=validated_data)
    #     # return favorite
    #     pass # ViewSet の perform_create で処理