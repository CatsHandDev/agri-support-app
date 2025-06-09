# backend/app/favorites/models.py
from django.db import models # type: ignore
from django.conf import settings # type: ignore
from app.products.models import Product # Product モデルをインポート

User = settings.AUTH_USER_MODEL

class FavoriteProduct(models.Model):
    """ユーザーがお気に入りにした商品"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 同じユーザーが同じ商品を複数お気に入りできないように制約
        unique_together = ('user', 'product')
        verbose_name = 'お気に入り商品'
        verbose_name_plural = 'お気に入り商品'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} favorites {self.product.name}"

# 同様に FavoriteProducer モデルなども作成可能