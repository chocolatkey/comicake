from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.shortcuts import get_object_or_404
from django.contrib.sites.shortcuts import get_current_site
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden, HttpResponseBadRequest, Http404, HttpResponsePermanentRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_POST
from django.contrib.flatpages.views import render_flatpage

from .models import Page, Post
from reader.models import Chapter
from . import settings as _settings
from .forms import ImageForm

import os
import json

# TrumboWyg editor upload image
@csrf_exempt
@require_POST
def upload_image(request):
    """
    Endpoint for image upload in the admin, usally from a WYSIWYG editor
    """
    if not request.is_ajax():
        return HttpResponseBadRequest    # bad request
    if not (request.user.is_active and request.user.is_staff):
        return HttpResponseForbidden    # forbidden

    image_form = ImageForm(request.POST, request.FILES)
    if image_form.is_valid():
        image = image_form.cleaned_data['image']
        path = os.path.join(_settings.UPLOAD_PATH, image.name)
        real_path = default_storage.save(path, image)
        context = {'success': True, 'file': default_storage.url(real_path)}
    else:
        context = {'success': False, 'message': image_form.errors['image'][0]}

    return JsonResponse(context)

# FlatPages
# TODO cache until flatpages updated
@cache_page(settings.CACHE_LONG)
def page(request, url):
    """
    Attempt to find a flatpage for the path and display it
    """
    if not url.startswith('/'):
        url = '/' + url
    site_id = get_current_site(request).id
    try:
        f = get_object_or_404(Page, url=url, sites=site_id)
    except Http404:
        if not url.endswith('/') and settings.APPEND_SLASH:
            url += '/'
            f = get_object_or_404(Page, url=url, sites=site_id)
            return HttpResponsePermanentRedirect('%s/' % request.path)
        else:
            raise
    return render_flatpage(request, f)

def home(request):
    """
    Homepage
    """
    chapters = Chapter.objects.filter(published=True, comic__published=True).prefetch_related('team', 'comic')
    posts = Post.objects.filter(published=True).prefetch_related('author')
    return render(request, 'home.html', {'chapters': chapters, 'posts': posts})

def archive(request, year=None, month=None, day=None):
    """
    Blog post archive
    """
    return HttpResponse("Archive not ready!")

def post(request, year, month, day, slug):
    """
    Blog posts
    """
    return HttpResponse("Post not ready!")