from django.urls import path, re_path
from django.views.generic import RedirectView

from . import views

page_regex = r'(?:/page(?:/(?P<page>[\d]{1,9}))?)?'

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='latest', permanent=True), name='index'),

    path('latest/', views.latest, name='latest'),
    path('latest/<int:page>/', views.latest, name='latest_page'),

    path('directory/', views.directory, name='directory'),
    path('directory/<int:page>/', views.directory, name='directory_page'),

    path('search/', views.search, name='search'),
    path('series/<str:series_slug>/', views.series, name='series'),
    path('team/<int:team_id>/', views.team, name='team'),
    path('person/<int:person_id>/', views.person, name='person'),

    path('read', RedirectView.as_view(pattern_name='latest', permanent=True), name='read_root'),
    path('read/<uuid:cid>/', views.read_uuid, name='read_uuid'),
    path('read/<uuid:cid>/manifest.json', views.read_manifest, name='read_uuid_manifest'),
    path('read/<uuid:cid>/next', views.read_next, name='read_uuid_next'),
    path('read/<uuid:cid>/prev', views.read_prev, name='read_uuid_prev'),
    path('read/<uuid:cid>/0', RedirectView.as_view(pattern_name='read_uuid_strip', permanent=True)), # Maintain legacy strip chapter path
    path('read/<uuid:cid>/strip', views.read_strip, name='read_uuid_strip'),
    path('read/<uuid:cid>/page/<int:page>', views.read_uuid_page, name='read_uuid_page'),
    path('dl/<uuid:cid>/', views.dl, name='dl_chapter'),
    re_path(r'^read/(?P<id>[\d]{1,9})/[\w-]+' + page_regex, views.read_id_slug, name='read_id_slug'),
    re_path(r'^read/(?P<series_slug>[\w-]+)/(?P<language>[a-z]{2,3})/(?P<volume>[\d]{1,9})/(?P<chapter>[\d]{1,9})(?:/(?P<subchapter>[\d]{1,9}))?' + page_regex + r'/$', views.read_pretty, name='read_pretty'),

    # RSS Feeds: Support optional extension
    path('feeds/rss.xml', views.RssChapterFeed(), name='feed_rss'),
    path('feeds/atom.xml', views.AtomChapterFeed(), name='feed_atom'),
    # Legacy FoOlSlide RSS Path
    path('feeds/rss/', views.RssChapterFeed()),
    path('feeds/atom/', views.AtomChapterFeed()),
    # RSS for individual comics
    path('feeds/rss/<uuid:cid>.xml', views.RssComicChapterFeed(), name='feed_rss_comic'),
    path('feeds/atom/<uuid:cid>.xml', views.AtomComicChapterFeed(), name='feed_atom_comic'),
]
