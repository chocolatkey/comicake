from django.contrib.auth.models import User, Group
from rest_framework.pagination import PageNumberPagination
from reader.models import Comic, Chapter, Team, Tag, Person, Licensee
from rest_framework import viewsets
from rest_framework.response import Response
from comicake import settings
from .serializers import UserSerializer, GroupSerializer, ComicSerializer, ChapterSerializer, TeamSerializer, TagSerializer, PersonSerializer, LicenseeSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import DjangoModelPermissionsOrAnonReadOnly, AllowAny
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

from rest_framework_extensions.etag.decorators import etag
from rest_framework_extensions.cache.decorators import cache_response
from rest_framework_extensions.etag.mixins import ETAGMixin
from rest_framework_extensions.cache.mixins import CacheResponseMixin

from raven.contrib.django.templatetags.raven import sentry_public_dsn

class CacheResponseAndETAGMixin(ETAGMixin, CacheResponseMixin):
     pass

class StatusViewSet(viewsets.GenericViewSet):
    """
    Endpoint for backend info
    """
    permission_classes = (AllowAny,)
    @etag()
    @cache_response()
    def list(self, request, format=None):
        status = {
            "site": settings.SITE_TITLE,
            "version": settings.VERSION,
            "language": settings.LANGUAGE_CODE,
            "analytics": settings.GA_ID,
            "raven": sentry_public_dsn(scheme="https"),
            "captcha": settings.PROTECTION["captcha"],
            "endpoints": {
                "static": settings.STATIC_URL,
                # TODO: reader a.k.a. /r endpoint
            },           

        }
        return Response(status)

class IdSetPagination(PageNumberPagination):
    page_size = 25
    #page_size_query_param = 'page_size'
    ordering = '-id' # '-creation' is default

class UserViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint that allows users to be viewed or edited.
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    filter_backends = (DjangoFilterBackend, SearchFilter)
    search_fields = ('username',)
    filter_fields = ('groups',)
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    pagination_class = IdSetPagination
    page_size_query_param = 'n'
    max_page_size = 100

    def get_queryset(self):
        queryset = User.objects.all()
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class PersonViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for people a.k.a. authors/artists
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    pagination_class = IdSetPagination
    page_size_query_param = 'n'
    max_page_size = 100
    filter_backends = (SearchFilter,)
    search_fields = ('name', 'alt')
    # TODO: possibly filter by is_active or show is_active

class LicenseeViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for comic licensees
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Licensee.objects.all()
    serializer_class = LicenseeSerializer
    # TODO: possibly filter by is_active or show is_active

class GroupViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint that allows groups to be viewed or edited.
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class TeamViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for teams
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    pagination_class = IdSetPagination
    page_size_query_param = 'n'
    max_page_size = 1000
    filter_backends = (DjangoFilterBackend, SearchFilter)
    search_fields = ('name',)
    filter_fields = ('members',)

    def get_queryset(self):
        queryset = Team.objects.all()
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class TagViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for comic tags
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class ComicViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for comics
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Comic.objects.all()
    serializer_class = ComicSerializer
    pagination_class = IdSetPagination
    page_size_query_param = 'n'
    max_page_size = 100
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filter_fields = ('slug', 'uniqid', 'author', 'artist', 'adult', 'licenses', 'format')
    search_fields = ('name', 'alt')
    ordering_fields = ('name', 'created_at', 'modified_at')
    #lookup_field = 'uniqid'

    def get_queryset(self):
        #pprint(vars(super().get_throttles()[1]))
        queryset = Comic.objects.filter(published=True)
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset

class ChapterSetPagination(PageNumberPagination):
    page_size = 25

class ChapterViewSet(CacheResponseAndETAGMixin, viewsets.ModelViewSet):
    """
    Endpoint for comics chapters
    """
    permission_classes = (DjangoModelPermissionsOrAnonReadOnly,)
    throttle_classes = (UserRateThrottle, AnonRateThrottle)
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    pagination_class = ChapterSetPagination
    page_size_query_param = 'n'
    max_page_size = 1000
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    filter_fields = ('comic', 'volume', 'team', 'language')
    ordering_fields = ('published_at', 'modified_at', 'volume', 'chapter', 'subchapter')
    #lookup_field = 'uniqid'

    def get_queryset(self):
        queryset = Chapter.only_published()
        # Set up eager loading to avoid N+1 selects
        queryset = self.get_serializer_class().setup_eager_loading(queryset)  
        return queryset