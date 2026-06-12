from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LearningPathViewSet, HeatmapView

router = DefaultRouter()
router.register(r'paths', LearningPathViewSet, basename='path')

urlpatterns = [
    path('', include(router.urls)),
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
]
