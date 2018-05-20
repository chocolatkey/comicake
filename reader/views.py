# pylint: disable=E1101
import os
from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.http import HttpResponse, Http404, HttpResponseForbidden, HttpResponseServerError, JsonResponse
from django.shortcuts import get_list_or_404, get_object_or_404, redirect
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.utils.cache import learn_cache_key
from django.urls import reverse
from django.db.models import Q
from .models import Chapter, Comic, Team, Page, Person
from .jsonld import chapterManifest

zxchapter = set()
zxcomic = set()
zxteam = set()
zxperson = set()


@cache_page(settings.CACHE_LONG)
def latest(request, page=1):
    chapters = list(Chapter.objects.filter(published=True, comic__published=True).prefetch_related('team', 'comic'))
    paginator = Paginator(chapters, 25)
    page_chapters = paginator.get_page(page)
    return render(request, 'reader/latest.html', {'chapters': page_chapters})

@cache_page(settings.CACHE_LONG)
def directory(request, page=1):
    comics = list(Comic.objects.filter(published=True).prefetch_related('author', 'artist'))
    paginator = Paginator(comics, 12)
    page_comics = paginator.get_page(page)
    return render(request, 'reader/directory.html', {'comics': page_comics})

@cache_page(settings.CACHE_LONG)
def series(request, series_slug):
    comic = get_object_or_404(Comic.objects.prefetch_related('author', 'artist', 'tags'), published=True, slug=series_slug)
    return render(request, 'reader/series.html', {'comic': comic})

@cache_page(settings.CACHE_LONG) # todo increase?
def read_pretty(request, series_slug, language, volume, chapter, subchapter=0, page=1):
    if volume == 0:
        volume = None
    if subchapter is None:
        subchapter = 0
    
    comic = get_object_or_404(Comic, slug=series_slug)
    chapter = get_object_or_404(Chapter, # TODO Order by subchapter ASCENDING and choose first from it if no subchap defined
        comic=comic, published=True, language=language, volume=volume, chapter=chapter, subchapter=subchapter
        )
    return read_uuid(request, chapter.uniqid, page)

@cache_page(settings.CACHE_LONG) # good times?
def read_uuid(request, cid, page=1):
    # TODO: If logged in show if not published anyway
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'team', 'protection'), published=True, uniqid=cid)
    manifest_url = request.build_absolute_uri(chapter.manifest())
    return render(request, 'reader/read.html', {'chapter': chapter, 'page': page, 'manifest_url': manifest_url})

@cache_page(settings.CACHE_LONG) # good times?
def read_manifest(request, cid):
    # TODO: If logged in show if not published anyway
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'team', 'protection', 'pages'), published=True, uniqid=cid)
    return JsonResponse(chapterManifest(request, chapter))

@cache_page(settings.CACHE_LONG) # good times?
def read_prev(request, cid):
    current_chapter = get_object_or_404(
        Chapter,
        published=True,
        uniqid=cid
        )
    prev_chapter = Chapter.objects.filter(published=True, comic=current_chapter.comic).filter(
        Q(chapter__lt=current_chapter.chapter, volume__lte=current_chapter.volume) | Q(volume__lte=current_chapter.volume, chapter=current_chapter.chapter, subchapter__lt=current_chapter.subchapter)
    ).first()
    if prev_chapter:
        return redirect(prev_chapter)
    else:
        return redirect(current_chapter.comic)

@cache_page(settings.CACHE_LONG) # good times?
def read_next(request, cid):
    current_chapter = get_object_or_404(
        Chapter,
        published=True,
        uniqid=cid
        )
    next_chapter = Chapter.objects.filter(published=True, comic=current_chapter.comic).filter(
        Q(chapter__gt=current_chapter.chapter, volume__gte=current_chapter.volume) | Q(volume__gte=current_chapter.volume, chapter=current_chapter.chapter, subchapter__gt=current_chapter.subchapter)
    ).last()
    if next_chapter:
        return redirect(next_chapter)
    else:
        return redirect(current_chapter.comic)

@cache_page(settings.CACHE_MEDIUM)
def search(request):
    response = render(request, 'reader/search.html')
    zxcomic.add(learn_cache_key(request, response))
    zxperson.add(learn_cache_key(request, response))
    return response

@cache_page(settings.CACHE_LONG)
def team(request, team_id):
    team = get_object_or_404(Team, pk=team_id)
    response = render(request, 'reader/team.html', {'team': team})
    zxteam.add(learn_cache_key(request, response))
    return response

@cache_page(settings.CACHE_LONG)
def person(request, person_id):
    person = get_object_or_404(Person, pk=person_id)
    response = render(request, 'reader/person.html', {'person': person})
    zxcomic.add(learn_cache_key(request, response))
    return response

class RssChapterFeed(Feed):
    def __call__(self, request, *args, **kwargs):
        keyname = self.__class__.__name__
        zxchapter.add(keyname)
        return cache.get_or_set(keyname , super(RssChapterFeed, self).__call__(request, *args, **kwargs), settings.CACHE_LONG)

    title = settings.SITE_TITLE

    def link(self, obj):
        return reverse('feed_rss')

    description = _("RSS Feed for %s") % settings.SITE_TITLE

    def ttl(self):
        return 60

    def items(self):
        return Chapter.objects.filter(published=True).prefetch_related('team', 'comic')[:25]
    
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
    def link(self, obj):
        return reverse('feed_atom')

    subtitle = _("Atom Feed for %s") % settings.SITE_TITLE

    feed_type = Atom1Feed

class RssComicChapterFeed(RssChapterFeed):
    def __call__(self, request, *args, **kwargs):
        keyname = "%s-%s" % (self.__class__.__name__, kwargs['cid'])
        zxchapter.add(keyname)
        zxcomic.add(keyname)
        return cache.get_or_set(keyname , super(RssComicChapterFeed, self).__call__(request, *args, **kwargs), settings.CACHE_LONG)

    def title(self, obj):
        return obj.name

    def link(self, obj):
        return reverse('feed_rss_comic', args=[obj.uniqid])

    def description(self, obj):
        return _("RSS Feed for %s") % obj.name

    def get_object(self, request, cid):
        return get_object_or_404(Comic, published=True, uniqid=cid)

    def ttl(self):
        return 60

    def items(self, obj):
        return Chapter.objects.filter(comic=obj, published=True).prefetch_related('team', 'comic')[:50]
    
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
        return _("Atom Feed for %s") % obj.name

    feed_type = Atom1Feed