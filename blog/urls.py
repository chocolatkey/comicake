from django.urls import path, re_path
from django.views.generic import RedirectView

from . import views
from django.conf import settings

urlpatterns = [
    path('', views.home, name='home'),
    path('blog/', views.archive, name='blog_archive'),
    path('blog/<int:page>/', views.archive, name='blog_archive_page'), # 5 per page
    path('blog/<int:year>/<int:month>/<int:day>/<slug:slug>/', views.post, name='blog_post'),
    path(settings.FRONTEND_CONFIG["paths"]["admin"] + 'upload_image/', views.upload_image, name='trumbowyg_upload_image'),

    # RSS Feeds: Support optional extension
    path('blog/feeds/rss.xml', views.RssPostFeed(), name='blog_feed_rss'),
    path('blog/feeds/atom.xml', views.AtomPostFeed(), name='blog_feed_atom'),
    
    #path('latest/<int:page>/', views.latest, name='latest_page')
]