from django.contrib.auth.models import User, Group
from rest_framework.pagination import PageNumberPagination
from reader.models import Comic, Chapter, Team
from rest_framework import viewsets
from .serializers import UserSerializer, GroupSerializer, ComicSerializer, ChapterSerializer, TeamSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

class PageSetPagination(PageNumberPagination):
    page_size = 25
    #page_size_query_param = 'page_size'
    ordering = '-created_at' # '-creation' is default

class UserViewSet(viewsets.ModelViewSet):
    '''mixins.CreateModelMixin, 
                   mixins.RetrieveModelMixin, 
                   mixins.UpdateModelMixin,
                   mixins.DestroyModelMixin,
                   mixins.ListModelMixin,
                   GenericViewSet'''
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class ComicViewSet(viewsets.ModelViewSet):
    queryset = Comic.objects.all()
    serializer_class = ComicSerializer
    pagination_class = PageSetPagination
    filter_backends = (DjangoFilterBackend,SearchFilter,)
    filter_fields = ('slug', 'uniqid')
    search_fields = ('name', 'alt')
    #lookup_field = 'uniqid'

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    pagination_class = PageSetPagination
    filter_backends = (DjangoFilterBackend,)
    filter_fields = ('comic',)
    #lookup_field = 'uniqid'