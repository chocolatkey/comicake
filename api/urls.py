from django.conf.urls import url, include
from rest_framework import routers
from rest_framework import views as rviews
from rest_framework.reverse import reverse
from django.urls import NoReverseMatch
from rest_framework.response import Response
from . import views
from collections import OrderedDict
from rest_framework_cache.registry import cache_registry
cache_registry.autodiscover()

class comicakeAPIRootView(rviews.APIView):
    """
    Root of the ComiCake API
    """
    _ignore_model_permissions = True
    schema = None  # exclude from schema
    api_root_dict = None

    def get(self, request, *args, **kwargs):
        # Return a plain {"name": "hyperlink"} response.
        ret = OrderedDict()
        namespace = request.resolver_match.namespace
        for key, url_name in self.api_root_dict.items():
            if namespace:
                url_name = namespace + ':' + url_name
            try:
                ret[key] = reverse(
                    url_name,
                    args=args,
                    kwargs=kwargs,
                    request=request,
                    format=kwargs.get('format', None)
                )
            except NoReverseMatch:
                # Don't bail out if eg. no list routes exist, only detail routes.
                continue

        return Response(ret)

class APIRouter(routers.DefaultRouter):
    APIRootView = comicakeAPIRootView


router = APIRouter(trailing_slash=False)
router.register(r'users', views.UserViewSet)
router.register(r'people', views.PersonViewSet)
router.register(r'licensees', views.LicenseeViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'comics', views.ComicViewSet)
router.register(r'chapters', views.ChapterViewSet)
router.register(r'teams', views.TeamViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'status', views.StatusViewSet, "api-status")

urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]