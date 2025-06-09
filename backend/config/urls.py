"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path, include  # type: ignore
from django.contrib import admin  # type: ignore
from django.urls import path  # type: ignore
from django.conf import settings  # type: ignore
from django.conf.urls.static import static  # type: ignore
from rest_framework.routers import DefaultRouter
from app.orders.views import OrderViewSet, ProducerOrderViewSet
# from django.conf import settings # type: ignore
# 実需者向け注文API用ルーター
my_orders_router = DefaultRouter()
my_orders_router.register(r'', OrderViewSet, basename='my-order')
# -> /api/my-orders/
# -> /api/my-orders/{order_id}/

# 生産者向け受注API用ルーター
producer_orders_router = DefaultRouter()
producer_orders_router.register(r'', ProducerOrderViewSet, basename='producer-order')
# -> /api/producer-orders/
# -> /api/producer-orders/{order_id}/
# -> /api/producer-orders/{order_id}/change-status/ (もしあれば)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("app.accounts.urls")),
    path("api/core/", include("app.core.urls")),
    path("api/messaging/", include("app.messaging.urls")),
    path("api/orders/", include("app.orders.urls")),
    path("api/payments/", include("app.payments.urls")),
    path("api/products/", include("app.products.urls")),
    path("api/profiles/", include("app.profiles.urls")),
    path("api/reviews/", include("app.reviews.urls")),
    path("api/favorites/", include("app.favorites.urls")),
    # 実需者の注文履歴など
    path('api/my-orders/', include(my_orders_router.urls)),
    # 生産者の受注管理など
    path('api/producer-orders/', include(producer_orders_router.urls)),
]

# ★開発用: メディアファイル配信設定
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
