from django.contrib.auth.models import User, Group
from rest_framework.pagination import PageNumberPagination
from reader.models import Comic, Chapter, Team, Tag, Person, Licensee
from rest_framework import viewsets
from .serializers import UserSerializer, GroupSerializer, ComicSerializer, ChapterSerializer, TeamSerializer, TagSerializer, PersonSerializer, LicenseeSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from django.views.decorators.cache import cache_page

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
    filter_backends = (DjangoFilterBackend, SearchFilter)
    search_fields = ('username',)
    filter_fields = ('groups',)
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    pagination_class = PageSetPagination

    def get_queryset(self):
        queryset = User.objects.all()
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    pagination_class = PageSetPagination
    filter_backends = (SearchFilter,)
    search_fields = ('name', 'alt')
    # TODO: possibly filter by is_active or show is_active

class LicenseeViewSet(viewsets.ModelViewSet):
    queryset = Licensee.objects.all()
    serializer_class = LicenseeSerializer
    # TODO: possibly filter by is_active or show is_active

class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    pagination_class = PageSetPagination
    filter_backends = (DjangoFilterBackend, SearchFilter)
    search_fields = ('name',)
    filter_fields = ('members',)
    def get_queryset(self):
        queryset = Team.objects.all()
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class ComicViewSet(viewsets.ModelViewSet):
    queryset = Comic.objects.all()
    serializer_class = ComicSerializer
    pagination_class = PageSetPagination
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filter_fields = ('slug', 'uniqid', 'author', 'artist', 'adult', 'licenses', 'format')
    search_fields = ('name', 'alt')
    ordering_fields = ('name', 'created_at', 'modified_at')
    #lookup_field = 'uniqid'
    def get_queryset(self):
        queryset = Comic.objects.filter(published=True)
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    pagination_class = PageSetPagination
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filter_fields = ('comic', 'volume', 'team', 'language')
    ordering_fields = ('created_at', 'modified_at')
    #lookup_field = 'uniqid'
    def get_queryset(self):
        queryset = Chapter.objects.filter(published=True)
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset