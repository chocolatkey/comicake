"""Blog app views"""
import os
from datetime import date
from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.shortcuts import get_object_or_404
from django.contrib.sites.shortcuts import get_current_site
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseBadRequest, Http404, HttpResponsePermanentRedirect
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_POST
from django.contrib.flatpages.views import render_flatpage
from django.urls import reverse
from django.core.paginator import Paginator
from django.dispatch import receiver
from django.db.models.signals import post_save

from .models import Page, Post
from reader.models import Chapter
from . import settings as _settings
from .forms import ImageForm
from reader.utils import cacheatron
from django.core.cache import cache
from reader.views import zxcomic, zxchapter

zxpost = set()
zxpage = set()

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
    return cacheatron(request, render_flatpage(request, f), (zxpage,))

@cache_page(settings.CACHE_MEDIUM)
def home(request):
    """
    Homepage
    """
    chapters = Chapter.only_published().prefetch_related('team', 'comic')
    posts = Post.objects.filter(published=True).prefetch_related('author')[:5]
    return cacheatron(
        request,
        render(request, 'blog/home.html', {'chapters': chapters, 'posts': posts}),
        (zxpost, zxchapter)
    )

@cache_page(settings.CACHE_LONG)
def archive(request, page=1, year=None, month=None, day=None):
    """
    Blog post archive
    """
    posts = Post.objects.filter(published=True).prefetch_related('author')
    paginator = Paginator(posts, 5)
    page_posts = paginator.get_page(page)
    return cacheatron(
        request,
        render(request, 'blog/archive.html', {'posts': page_posts}),
        (zxpost,)
    )

@cache_page(settings.CACHE_MEDIUM)
def post(request, year, month, day, slug):
    """
    Blog posts
    """
    try:
        cdate = date(year, month, day)
    except ValueError:
        raise Http404
    blog_post = get_object_or_404(
        Post,
        slug=slug,
        created_at__contains=cdate
    )
    return cacheatron(
        request,
        render(request, 'blog/post.html', {'post': blog_post}),
        (zxpost,)
    )

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

@csrf_exempt
@require_POST
def upload_image(request):
    """
    TrumboWyg editor image upload endpoint
    """
    if not request.is_ajax():
        return HttpResponseBadRequest
    if not (request.user.is_active and request.user.is_staff):
        return HttpResponseForbidden

    image_form = ImageForm(request.POST, request.FILES)
    if image_form.is_valid():
        image = image_form.cleaned_data['image']
        path = os.path.join(_settings.UPLOAD_PATH, image.name)
        real_path = default_storage.save(path, image)
        context = {'success': True, 'file': default_storage.url(real_path)}
    else:
        context = {'success': False, 'message': image_form.errors['image'][0]}

    return JsonResponse(context)

### Purgers ###

@receiver(post_save, sender=Page)
def purge_page_cache(sender, **kwargs):
    from blog import views
    cache.delete_many(views.zxpage)
    views.zxpage = set()

@receiver(post_save, sender=Post)
def purge_post_cache(sender, **kwargs):
    from blog import views
    cache.delete_many(views.zxpost)
    views.zxpost = set()