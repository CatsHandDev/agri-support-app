# backend/app/orders/urls.py
from django.urls import path, include  # type: ignore
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet,
    ProducerOrderViewSet,
)  # ViewSetが正しくインポートされているか

app_name = "orders"  # 任意

router = DefaultRouter()
router.register(r"", OrderViewSet, basename="order")
router.register(r"producer-orders", ProducerOrderViewSet, basename="producer-order")

urlpatterns = [
    path("", include(router.urls)),
]
