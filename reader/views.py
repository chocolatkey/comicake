"""Reader app views"""
# pylint: disable=E1101
from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _
from django.http import HttpResponse, Http404, HttpResponseForbidden, HttpResponseServerError
from django.shortcuts import get_list_or_404, get_object_or_404, redirect
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed
from django.views.decorators.cache import cache_page
from django.views.decorators.http import last_modified
from django.core.cache import cache
from django.utils.cache import learn_cache_key
from django.urls import reverse
from django.db.models import Q
from django.template import loader
from django.dispatch import receiver
from django.db.models.signals import post_save

from .models import Chapter, Comic, Team, Page, Person
from .jsonld import chapterManifest
from .utils import cacheatron, free_json_response

zxchapter = set()
zxcomic = set()
zxteam = set()
zxperson = set()

### Caching Helpers

def latest_chapter(request, **kwargs):
    latest_chap = Chapter.only_published(prefetch_comic=False).order_by('-modified_at').only('modified_at')[0]
    if latest_chap:
        return latest_chap.modified_at
    else:
        return None

def latest_comic(request, **kwargs):
    latest_comic = Comic.objects.filter(published=True).order_by('-modified_at').only('modified_at')[0]
    if latest_comic:
        return latest_comic.modified_at
    else:
        return None

def chapter_last_modified(request, cid, page=1):
    return get_object_or_404(Chapter.objects.only('modified_at'), published=True, uniqid=cid).modified_at

###

@cache_page(settings.CACHE_MEDIUM)
@last_modified(latest_chapter)
def latest(request, page=1):
    """
    Latest chapter releases
    """
    chapters = Chapter.only_published().prefetch_related('team')
    paginator = Paginator(chapters, 25)
    page_chapters = paginator.get_page(page)
    return cacheatron(
        request,
        render(request, 'reader/latest.html', {'chapters': page_chapters}),
        (zxchapter, zxcomic) # If a chapter or comic's data is modified
    )

@cache_page(settings.CACHE_LONG)
@last_modified(latest_comic)
def directory(request, page=1):
    """
    Comic directory
    """
    comics = Comic.objects.filter(published=True).prefetch_related('author', 'artist')
    paginator = Paginator(comics, 12)
    page_comics = paginator.get_page(page)
    return cacheatron(
        request,
        render(request, 'reader/directory.html', {'comics': page_comics}),
        (zxcomic, zxchapter) # If comic metadata or chapter (for latest release) modified 
    )

@cache_page(settings.CACHE_MEDIUM)
def series(request, series_slug):
    """
    Individual comic series
    """
    comic = get_object_or_404(Comic.objects.all().prefetch_related('author', 'artist', 'tags', 'licenses'), published=True, slug=series_slug)
    return cacheatron(
        request,
        render(request, 'reader/series.html', {'comic': comic}),
        (zxcomic, zxchapter) # If comic/chapter data modified
    )

@cache_page(settings.CACHE_LONG)
def read_pretty(request, series_slug, language, volume, chapter, subchapter=0, page=1):
    """
    Pretty URL redirect to read chapter, handles migration from FoOlSlide URL schema
    """
    if volume == 0:
        volume = None
    if subchapter is None:
        subchapter = 0

    comic = get_object_or_404(Comic, slug=series_slug)
    chapter = get_object_or_404(Chapter, # TODO Order by subchapter ASCENDING and choose first from it if no subchap defined
        comic=comic, published=True, language=language, volume=volume, chapter=chapter, subchapter=subchapter
    )
    return cacheatron(
        request,
        read_uuid(request, chapter.uniqid),
        (zxchapter,) # If chapter data modified
    )

@cache_page(settings.CACHE_MEDIUM)
def read_id_slug(request, id, page):
    """
    SEO and human-friendly reader URL for specific chapter
    """
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'comic__author', 'comic__artist', 'comic__tags', 'team', 'protection'), published=True, id=cid)
    manifest_url = request.build_absolute_uri(chapter.manifest())
    return cacheatron(
        request,
        render(request, 'reader/read.html', {'chapter': chapter, 'manifest_url': manifest_url, 'current_page': page if page else 1}),
        (zxchapter,) #  Only if chapter data modified
    )


@cache_page(settings.CACHE_MEDIUM)
@last_modified(chapter_last_modified)
def read_uuid(request, cid):
    """
    Reader for specific chapter
    """
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'comic__author', 'comic__artist', 'comic__tags', 'team', 'protection'), published=True, uniqid=cid)
    manifest_url = request.build_absolute_uri(chapter.manifest())
    return cacheatron(
        request,
        render(request, 'reader/read.html', {'chapter': chapter, 'manifest_url': manifest_url, 'current_page': 1}),
        (zxchapter,) #  Only if chapter data modified
    )

@cache_page(settings.CACHE_MEDIUM)
@last_modified(chapter_last_modified)
def read_uuid_page(request, cid, page):
    """
    Reader for specific chapter at specific page
    """
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'comic__author', 'comic__artist', 'comic__tags', 'team', 'protection'), published=True, uniqid=cid)
    manifest_url = request.build_absolute_uri(chapter.manifest())
    return cacheatron(
        request,
        render(request, 'reader/read.html', {'chapter': chapter, 'manifest_url': manifest_url, 'current_page': page}),
        (zxchapter,) #  Only if chapter data modified
    )

@cache_page(settings.CACHE_MEDIUM)
@last_modified(chapter_last_modified)
def read_strip(request, cid):
    """
    Strip reader (no JavaScript required) for specific chapter
    """
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'comic__author', 'comic__artist', 'comic__tags', 'team', 'protection'), published=True, uniqid=cid)
    manifest_url = request.build_absolute_uri(chapter.manifest())
    return cacheatron(
        request,
        render(request, 'reader/read_strip.html', {'chapter': chapter, 'manifest_url': manifest_url}),
        (zxchapter,) #  Only if chapter data modified
    )

@cache_page(settings.CACHE_MEDIUM)
@last_modified(chapter_last_modified)
def read_manifest(request, cid):
    """
    Chapter WebPub manifest
    """
    # TODO: If logged in show if not published anyway
    chapter = get_object_or_404(Chapter.objects.prefetch_related('comic', 'team', 'protection', 'pages'), published=True, uniqid=cid)
    return cacheatron(
        request,
        free_json_response(chapterManifest(request, chapter)),
        (zxchapter,) # Only if chapter data modifed. Other expensive data will be updated after CACHE_MEDIUM time expires anyway
    )

@cache_page(settings.CACHE_LONG) # good times?
def read_prev(request, cid):
    """
    Redirect to the chapter before a chapter
    """
    current_chapter = get_object_or_404(
        Chapter,
        published=True,
        uniqid=cid
    )
    prev_chapter = Chapter.only_published(comic=current_chapter.comic).filter(
        Q(
            chapter__lt=current_chapter.chapter,
            volume__lte=current_chapter.volume) | Q(volume__lte=current_chapter.volume,
            chapter=current_chapter.chapter,
            subchapter__lt=current_chapter.subchapter
        )
    ).first()
    if prev_chapter:
        response = redirect(prev_chapter)
    else:
        response = redirect(current_chapter.comic)
    return cacheatron(request, response, (zxchapter,))

@cache_page(settings.CACHE_LONG)
def read_next(request, cid):
    """
    Redirect to the chapter after a chapter
    """
    current_chapter = get_object_or_404(
        Chapter,
        published=True,
        uniqid=cid
    )
    '''
    print(Chapter.only_published(comic=current_chapter.comic).filter(
        Q(
            chapter__gt=current_chapter.chapter,
            volume__gte=current_chapter.volume) | Q(volume__gte=current_chapter.volume,
            chapter=current_chapter.chapter,
            subchapter__gt=current_chapter.subchapter
        )
    ))#http://127.0.0.1:8000/r/read/88ed2a0b-d281-4b47-bb08-4571c9cfb5cd/next'
    '''
    next_chapter = Chapter.only_published(comic=current_chapter.comic).filter(
        Q(
            chapter__gt=current_chapter.chapter,
            volume__gte=current_chapter.volume) | Q(volume__gte=current_chapter.volume,
            chapter=current_chapter.chapter,
            subchapter__gt=current_chapter.subchapter
        )
    ).last()
    if next_chapter:
        response = redirect(next_chapter)
    else:
        response = redirect(current_chapter.comic)
    return cacheatron(request, response, (zxchapter,))

@cache_page(settings.CACHE_MEDIUM)
#@last_modified(TODO)
def search(request):
    """
    Search page
    """
    # TODO: finish search
    return cacheatron(
        request,
        render(request, 'reader/search.html'),
        (zxcomic, zxperson, zxchapter) # If any searchable data modified
    )

@cache_page(settings.CACHE_LONG)
#@last_modified(TODO)
def team(request, team_id):
    """
    Team info
    """
    team = get_object_or_404(Team, pk=team_id)
    return cacheatron(
        request,
        render(request, 'reader/team.html', {'team': team}),
        (zxteam,) # If team modified
    )

@cache_page(settings.CACHE_LONG)
#@last_modified(TODO)
def person(request, person_id):
    """
    Person (author/artist) info
    """
    person = get_object_or_404(Person, pk=person_id)
    return cacheatron(
        request,
        render(request, 'reader/person.html', {'person': person}),
        (zxcomic, zxperson) # If comic or person modified
    )

### Feeds ###

def make_feed_chapter(request, item):
    if item.get_protection():
        return item.comic.thumb() # Only show thumbnail
    else:
        return loader.render_to_string("partials/pages.html", {'pages': item.pages.all, 'request': request})  # Let them read the chapter in good ol' RSS

class RssChapterFeed(Feed):
    def __call__(self, request, *args, **kwargs):
        keyname = self.__class__.__name__
        self.request = request
        zxchapter.add(keyname)
        return cache.get_or_set(keyname , super(RssChapterFeed, self).__call__(request, *args, **kwargs), settings.CACHE_MEDIUM)

    title = settings.SITE_TITLE

    def link(self, obj):
        return reverse('feed_rss')

    description = _("Chapter RSS Feed for %s") % settings.SITE_TITLE

    def ttl(self):
        return settings.CACHE_MEDIUM

    def items(self):
        return Chapter.only_published().prefetch_related('team', 'pages')[:25]
    
    def item_title(self, item):
        return "{} {}".format(item.comic.name, item.full_title())
    
    def item_description(self, item):
        return make_feed_chapter(self.request, item)
    
    def item_guid(self, item):
        return item.uniqid
    
    def item_author_name(self, item):
        return item.teams()
    
    def item_pubdate(self, item):
        return item.published_at
    
    def item_updateddate(self, item):
        return item.modified_at
    
    def item_categories(self, item):
        return item.comic.tags.all()

class AtomChapterFeed(RssChapterFeed):
    def link(self, obj):
        return reverse('feed_atom')

    subtitle = _("Chapter Atom Feed for %s") % settings.SITE_TITLE

    feed_type = Atom1Feed

class RssComicChapterFeed(Feed):
    def __call__(self, request, *args, **kwargs):
        keyname = "%s-%s" % (self.__class__.__name__, kwargs['cid'])
        self.request = request
        zxchapter.add(keyname)
        zxcomic.add(keyname)
        return cache.get_or_set(keyname , super(RssComicChapterFeed, self).__call__(request, *args, **kwargs), settings.CACHE_MEDIUM)

    def title(self, obj):
        return obj.name

    def link(self, obj):
        return reverse('feed_rss_comic', args=[obj.uniqid])

    def description(self, obj):
        return _("Chapter RSS Feed for %s") % obj.name

    def get_object(self, request, cid):
        return get_object_or_404(Comic, published=True, uniqid=cid)

    def ttl(self):
        return settings.CACHE_MEDIUM

    def items(self, obj):
        return Chapter.only_published(comic=obj).prefetch_related('team', 'pages')[:50]
    
    def item_title(self, item):
        return "{} {}".format(item.comic.name, item.full_title())
    
    def item_description(self, item):   
        return make_feed_chapter(self.request, item)
    
    def item_guid(self, item):
        return item.uniqid
    
    def item_author_name(self, item):
        return item.teams()
    
    def item_pubdate(self, item):
        return item.published_at
    
    def item_updateddate(self, item):
        return item.modified_at
    
    def item_categories(self, item):
        return item.comic.tags.all()

class AtomComicChapterFeed(RssComicChapterFeed):
    def link(self, obj):
        return reverse('feed_atom_comic', args=[obj.uniqid])

    def subtitle(self, obj):
        return _("Chapter Atom Feed for %s") % obj.name

    feed_type = Atom1Feed

### Purgers ###

@receiver(post_save, sender=Chapter)
def purge_chapter_cache(sender, **kwargs):
    from reader import views
    cache.delete_many(views.zxchapter)
    views.zxchapter = set()

@receiver(post_save, sender=Comic)
def purge_comic_cache(sender, **kwargs):
    from reader import views
    cache.delete_many(views.zxcomic)
    views.zxcomic = set()

@receiver(post_save, sender=Team)
def purge_team_cache(sender, **kwargs):
    from reader import views
    cache.delete_many(views.zxteam)
    views.zxteam = set()

@receiver(post_save, sender=Person)
def purge_person_cache(sender, **kwargs):
    from reader import views
    cache.delete_many(views.zxperson)
    views.zxperson = set()