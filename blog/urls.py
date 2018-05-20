from django.urls import path, re_path
from django.views.generic import RedirectView

from . import views
from django.conf import settings

urlpatterns = [
    path('', views.home, name='home'),
    path('blog/', views.archive),
    path('blog/<int:year>/', views.archive),
    path('blog/<int:year>/<int:month>/', views.archive),
    path('blog/<int:year>/<int:month>/<int:day>/', views.archive),
    path('blog/<int:year>/<int:month>/<int:day>/<slug:slug>/', views.post, name='post'),
    path(settings.FRONTEND_CONFIG["paths"]["admin"] + 'upload_image/', views.upload_image, name='trumbowyg_upload_image'),
    
    #path('latest/<int:page>/', views.latest, name='latest_page')
]