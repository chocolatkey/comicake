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
from django.views.decorators.cache import cache_page
from reader.models import Chapter, Comic
from . import views
from django.views.generic import TemplateView
from django.views.decorators.cache import cache_page

# TODO Finish: https://docs.djangoproject.com/en/2.0/ref/contrib/sitemaps/
sitemaps = {
    'chapters': GenericSitemap({
        'queryset': Chapter.objects.filter(published=True),
        'date_field: ': 'created_at'
    }, priority=0.4, changefreq='daily')
}

urlpatterns = [
    #re_path(r'^_nested_admin/', include('nested_admin.urls')),
    path('', views.home),
    path('sw.js', cache_page(None)(TemplateView.as_view(
    template_name="sw.js",
    content_type='application/javascript',
    )), name='sw.js'),
    path('a/', admin.site.urls),
    path('api/', include('api.urls')),
    path('r/', include('reader.urls')),
    path('sitemap.xml', cache_page(3600)(sitemap), {'sitemaps': sitemaps},
     name='django.contrib.sitemaps.views.sitemap')
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns