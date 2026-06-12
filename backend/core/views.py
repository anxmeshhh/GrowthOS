from rest_framework import viewsets, views
from rest_framework.response import Response
from .models import LearningPath, Topic, Contribution
from .serializers import LearningPathSerializer, TopicSerializer, ContributionSerializer
from django.db.models import Sum

class LearningPathViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LearningPath.objects.filter(is_active=True)
    serializer_class = LearningPathSerializer
    lookup_field = 'slug'

class HeatmapView(views.APIView):
    def get(self, request):
        # Using a dummy user since auth isn't fully set up yet.
        # In a real app we'd use request.user
        contributions = Contribution.objects.values('date').annotate(total_points=Sum('points'))
        
        # Format for react-calendar-heatmap or similar: [{date: '2026-06-12', count: 5}, ...]
        data = [
            {
                "date": str(c['date']),
                "count": c['total_points']
            }
            for c in contributions
        ]
        return Response(data)
