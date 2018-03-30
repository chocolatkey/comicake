from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.http import HttpResponse, Http404, HttpResponseForbidden, HttpResponseServerError
from django.shortcuts import get_list_or_404, get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.urls import reverse


from .models import Chapter, Comic, Team

def latest(request, page=1):
    chapters = list(Chapter.objects.filter(published=True, comic__published=True).prefetch_related('team', 'comic'))

    paginator = Paginator(chapters, 25)
    page_chapters = paginator.get_page(page)
    return render(request, 'reader/latest.html', {'chapters': page_chapters})
    #raise Http404("TODO")
    #question = get_object_or_404(Question, pk=question_id)
    #from django.shortcuts import get_object_or_404, render
    #get_list_or_404()
    #my_objects = list(MyModel.objects.filter(published=True))
    #if not my_objects:
    #    raise Http404("No MyModel matches the given query.")

def directory(request, page=1):
    comics = list(Comic.objects.filter(published=True))
    paginator = Paginator(comics, 12)
    page_comics = paginator.get_page(page)
    return render(request, 'reader/directory.html', {'comics': page_comics})

def series(request, series_slug):
    comic = get_object_or_404(Comic.objects.prefetch_related('author', 'artist', 'tags'), published=True, slug=series_slug)
    chapters = list(Chapter.objects.filter(published=True, comic=comic).order_by('-volume', '-chapter', '-subchapter').prefetch_related('team', 'comic'))
    return render(request, 'reader/series.html', {'comic': comic, 'chapters': chapters})

def read_pretty(request, series_slug, language, volume, chapter, subchapter=0, page=1):
    # TODO Order by subchapter ASCENDING and choose first from it if no subchap defined
    if volume == 0:
        volume = None
    if subchapter is None:
        subchapter = 0
    
    comic = get_object_or_404(Comic, slug=series_slug)
    chapter = get_object_or_404(Chapter,
        comic=comic, published=True, language=language, volume=volume, chapter=chapter, subchapter=subchapter
        )
    return read_uuid(request, chapter.uniqid, page)

def read_uuid(request, cid, page=1):
    # TODO: If logged in show if not published anyway
    chapter = get_object_or_404(Chapter, published=True, uniqid=cid)
    return HttpResponseServerError("Reader not ready!")

def search(request):
    return HttpResponseServerError("Search not ready!")

def team(request, team_id):
    return HttpResponseServerError("Team page not ready!")

class RssChapterFeed(Feed):
    def __call__(self, request, *args, **kwargs):
        return cache.get_or_set(self.__class__.__name__, super(RssChapterFeed, self).__call__(request, *args, **kwargs), 60)
    title = settings.SITE_TITLE
    link = "/feeds/rss.xml"
    description = _("RSS Feed for %s") % settings.SITE_TITLE

    def ttl(self):
        return 60

    def items(self):
        return Chapter.objects.prefetch_related('team', 'comic').all()[:25]
    
    def item_title(self, item):
        return "{} {}".format(item.comic.name, item.full_title())
    
    def item_description(self, item):
        return item.comic.thumb()
    
    def item_guid(self, item):
        return item.uniqid
    
    def item_author_name(self, item):
        return item.teams()
    
    def item_pubdate(self, item):
        return item.created_at
    
    def item_updateddate(self, item):
        return item.modified_at
    
    def item_categories(self, item):
        return item.comic.tags.all()

class AtomChapterFeed(RssChapterFeed):
    link = "/feeds/atom.xml"
    feed_type = Atom1Feed
    subtitle = _("Atom Feed for %s") % settings.SITE_TITLE

class RssComicChapterFeed(RssChapterFeed):
    def __call__(self, request, *args, **kwargs):
        return cache.get_or_set("%s-%s" % (self.__class__.__name__, kwargs['cid']) , super(RssComicChapterFeed, self).__call__(request, *args, **kwargs), 60)

    def title(self, obj):
        return obj.name

    def link(self, obj):
        return reverse('feed_rss_comic', args=[obj.uniqid])

    def description(self, obj):
        description = _("RSS Feed for %s") % obj.name

    def get_object(self, request, cid):
        return get_object_or_404(Comic, published=True, uniqid=cid)

    def ttl(self):
        return 60

    def items(self, obj):
        return Chapter.objects.filter(comic=obj)
    
    def item_title(self, item):
        return "{} {}".format(item.comic.name, item.full_title())
    
    def item_description(self, item):
        return item.comic.thumb()
    
    def item_guid(self, item):
        return item.uniqid
    
    def item_author_name(self, item):
        return item.teams()
    
    def item_pubdate(self, item):
        return item.created_at
    
    def item_updateddate(self, item):
        return item.modified_at
    
    def item_categories(self, item):
        return item.comic.tags.all()

class AtomComicChapterFeed(RssComicChapterFeed):
    def link(self, obj):
        return reverse('feed_atom_comic', args=[obj.uniqid])

    def subtitle(self, obj):
        description = _("Atom Feed for %s") % obj.name

    feed_type = Atom1Feed