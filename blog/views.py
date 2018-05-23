from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.shortcuts import get_object_or_404
from django.contrib.sites.shortcuts import get_current_site
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden, HttpResponseBadRequest, Http404, HttpResponsePermanentRedirect
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_POST
from django.contrib.flatpages.views import render_flatpage
from datetime import date
from django.core.cache import cache
from django.urls import reverse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

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

@cache_page(settings.CACHE_MEDIUM)
def home(request):
    """
    Homepage
    """
    chapters = Chapter.only_published().prefetch_related('team', 'comic')
    posts = Post.objects.filter(published=True).prefetch_related('author')[:5]
    return render(request, 'home.html', {'chapters': chapters, 'posts': posts})

@cache_page(settings.CACHE_MEDIUM)
def archive(request, page=1, year=None, month=None, day=None):
    """
    Blog post archive
    """
    posts = Post.objects.filter(published=True).prefetch_related('author')
    paginator = Paginator(posts, 5)
    page_posts = paginator.get_page(page)
    return render(request, 'blog/archive.html', {'posts': page_posts})

@cache_page(settings.CACHE_MEDIUM)
def post(request, year, month, day, slug):
    """
    Blog posts
    """
    try:
        cdate = date(year, month, day)
    except ValueError:
        raise Http404
    post = get_object_or_404(Post,
        slug=slug,
        created_at__contains=cdate
        )
    return render(request, 'blog/post.html', {'post': post})

### Feeds ###

class RssPostFeed(Feed):
    def __call__(self, request, *args, **kwargs):
        keyname = self.__class__.__name__
        return cache.get_or_set(keyname , super(RssPostFeed, self).__call__(request, *args, **kwargs), settings.CACHE_MEDIUM)

    title = settings.SITE_TITLE

    def link(self, obj):
        return reverse('blog_feed_rss')

    description = _("Blog RSS Feed for %s") % settings.SITE_TITLE

    def ttl(self):
        return settings.CACHE_MEDIUM

    def items(self):
        return Post.objects.filter(published=True).prefetch_related('author')[:25]
    
    def item_title(self, item):
        return item.title
    
    def item_description(self, item):
        return item.content
    
    def item_guid(self, item):
        return item.get_absolute_url()
    
    def item_author_name(self, item):
        if item.author:
            return item.author.username # Could be first_name + last_name
        else:
            return None
    
    def item_pubdate(self, item):
        return item.created_at
    
    def item_updateddate(self, item):
        return item.modified_at

class AtomPostFeed(RssPostFeed):
    def link(self, obj):
        return reverse('blog_feed_atom')

    subtitle = _("Blog Atom Feed for %s") % settings.SITE_TITLE

    feed_type = Atom1Feed