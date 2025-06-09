# backend/app/favorites/urls.py
from django.urls import path, include # type: ignore
from rest_framework.routers import DefaultRouter
from .views import FavoriteProductViewSet

app_name = 'favorites'
router = DefaultRouter()
router.register(r'products', FavoriteProductViewSet, basename='favorite-product')

urlpatterns = [
    path('', include(router.urls)),
]