"""comicake URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
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
from django.contrib import admin
from django.conf import settings
from django.urls import path, include, re_path
from django.contrib.sitemaps.views import sitemap
from django.contrib.sitemaps import GenericSitemap
from django.contrib.flatpages.sitemaps import FlatPageSitemap
from django.views.decorators.cache import cache_page
from django.views.generic import TemplateView
from django.views.decorators.cache import cache_page
from django.views.i18n import JavaScriptCatalog
from . import settings
from reader.models import Chapter, Comic, Team, Person
from blog.models import Post

# Admin  site settings
admin.site.site_title = settings.APP_NAME
admin.site.site_header = settings.SITE_TITLE
admin.site.index_title = settings.APP_NAME + ' Management System' # TODO translate


# https://docs.djangoproject.com/en/2.0/ref/contrib/sitemaps/
sitemaps = {
    'chapters': GenericSitemap({
        'queryset': Chapter.only_published(),
        'date_field: ': 'modified_at'
    }, priority=0.6, changefreq='daily'),
    'comics': GenericSitemap({
        'queryset': Comic.only_published(),
        'date_field: ': 'modified_at'
    }, priority=0.4, changefreq='weekly'),
    'teams': GenericSitemap({
        'queryset': Team.objects.all()
    }, priority=0.4, changefreq='daily'),
    'people': GenericSitemap({
        'queryset': Person.objects.all()
    }, priority=0.4, changefreq='weekly'),
    'posts': GenericSitemap({
        'queryset': Post.objects.all()
    }, priority=0.4, changefreq='weekly'),
    'pages': FlatPageSitemap
}

paths = settings.FRONTEND_CONFIG["paths"]

urlpatterns = [
    path('i18n/', cache_page(None)(JavaScriptCatalog.as_view(packages=['reader'])), name='jsi18n'),
    path('sw.js', cache_page(None)(TemplateView.as_view(
    template_name="sw.js",
    content_type='application/javascript',
    )), name='sw.js'),
    path(paths["admin"], admin.site.urls),
    path(paths["api"], include('api.urls')),
    path(paths["cms"], include('blog.urls')),
    path(paths["reader"], include('reader.urls')),
    path('sitemap.xml', cache_page(3600)(sitemap), {'sitemaps': sitemaps},
     name='django.contrib.sitemaps.views.sitemap')
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns