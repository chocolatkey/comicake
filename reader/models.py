# pylint: disable=E1101
from django.db import models
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.safestring import mark_safe
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import uuid
import os
from django.db.models.signals import post_delete
from .utils import file_cleanup, LanguageField
from django.utils.translation import gettext as _
from django.urls import reverse
from django.db.models import Q
#from django_markdown.models import MarkdownField

from django.contrib.sites.models import Site
from dynamic_preferences.models import PerInstancePreferenceModel

class SitePreferenceModel(PerInstancePreferenceModel):

    # note: you *have* to use the `instance` field
    instance = models.ForeignKey(Site, on_delete=models.CASCADE)

    class Meta:
        # Specifying the app_label here is mandatory for backward
        # compatibility reasons, see #96
        app_label = 'reader'

class Tag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True, max_length=20)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    #class Meta:
        #permissions

class Licensee(models.Model):
    name = models.CharField(max_length=50)
    homepage = models.CharField(max_length=80, blank=True, help_text=_("Link to liscensee's website"))
    logo = models.ImageField(upload_to='misc', blank=True, help_text=_("Licensee's logo, preferably transparent"))
    # TODO countries for DMCA maybe?

    def __str__(self):
        return self.name

class Person(models.Model):
    class Meta:
        verbose_name_plural = "people"
        ordering = ('-id',)
    name = models.CharField(max_length=100, unique=True, db_index=True)
    alt = models.CharField(max_length=100, blank=True, help_text=_('Name in native language'), db_index=True)

    def comics(self):
        return Comic.objects.filter(Q(published=True), Q(artist=self) | Q(author=self)).order_by('-modified_at')

    def get_absolute_url(self):
        return reverse('person', args=[self.id])

    def __str__(self):
        return self.name

class Comic(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    uniqid = models.UUIDField(_("Unique ID"), unique=True, default=uuid.uuid4, editable=False, help_text=_("Filesystem identifier for this object"))
    slug = models.SlugField(unique=True, help_text=_("Changing this will break URLs"), max_length=50)
    alt = models.CharField(_('Alternate title'), blank=True, help_text=_('The original title, or title in another language'), max_length=200, db_index=True)
    author = models.ManyToManyField(Person, blank=True, related_name='%(class)s_comic_author')
    artist = models.ManyToManyField(Person, blank=True, related_name='%(class)s_comic_artist')
    tags = models.ManyToManyField(Tag, blank=True)
    description = models.TextField(_("Synopsis"), blank=True)
    published = models.BooleanField(default=True, db_index=True)
    adult = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    modified_at = models.DateTimeField(auto_now=True, db_index=True)
    licenses = models.ManyToManyField(Licensee, blank=True)
    COMIC_FORMATS = (
        (0, _('Manga')),
        (1, _('Toon')),
        (2, _('Classic')),
        (3, _('LTR Book')),
        (4, _('RTL Book'))
    )

    def authors(self):
        mlist = ""
        for team in self.author.all():
            mlist += team.name + ", "
        return mlist
    authors.short_description = _("Author(s)")

    def artists(self):
        mlist = ""
        for team in self.artist.all():
            mlist += team.name + ", "
        return mlist
    artists.short_description = _("Artist(s)")

    format = models.PositiveSmallIntegerField(choices=COMIC_FORMATS, blank=False, default=0)

    def path(self, filename):
        # file will be uploaded to MEDIA_ROOT/stuff_below
        return str('{0}' + os.sep + '{1}').format(str(self.uniqid), filename)

    cover = models.ImageField(upload_to=path, blank=True)
    chapter_title = models.CharField(_("Custom chapter title"), blank=True, max_length=200, help_text=_('Replace the default chapter title with a custom format. Example: "{num}{ord} Stage" returns "2nd Stage"'))

    def thumb(self):
        try:
            return mark_safe('<img src="%s" height="150"/>' % self.cover.url)
        except Exception as e:
            return ''
    thumb.short_description = ''

    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('series', args=[self.slug])

    def chapters(self):
        return Chapter.objects.filter(published=True, comic=self).order_by('-volume', '-chapter', '-subchapter').prefetch_related('team', 'comic')
    
    def latest_chapter(self):
        return Chapter.objects.filter(published=True, comic=self).order_by('-volume', '-chapter', '-subchapter')[:1].get()
    
    class Meta:
        ordering = ('name',)
post_delete.connect(file_cleanup, sender=Comic, dispatch_uid="comic.file_cleanup")

class Team(models.Model):
    name = models.CharField(max_length=256, db_index=True)
    #slug = models.SlugField(unique=True, help_text=_("Changing this may break URLs"), max_length=20)
    members = models.ManyToManyField(User, blank=True)
    description = models.TextField(blank=True)

    def get_absolute_url(self):
        return reverse('team', args=[self.id])
        
    def chapters(self):
        return Chapter.objects.filter(published=True, team=self).order_by('-volume', '-chapter', '-subchapter').prefetch_related('team', 'comic')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-id',)
'''
class Joint(models.Model):
    members = models.ManyToManyField(Team)
    def __str__(self):
        mlist = ""
        for member in self.members.all():
            mlist += member.name + ", "
        return mlist
'''
class Protection(models.Model):
    hslices = models.PositiveSmallIntegerField()
    vslices = models.PositiveSmallIntegerField()
    key = models.CharField(max_length=256)

    def default_expiry(self):
        return timezone.now() + timedelta(days=1)

    expires = models.DateTimeField(default=default_expiry)
    

class Chapter(models.Model):
    comic = models.ForeignKey(Comic, on_delete=models.CASCADE)
    uniqid = models.UUIDField(_("Unique ID"), unique=True, default=uuid.uuid4, editable=False, help_text=_("Filesystem identifier for this object"))
    protection = models.OneToOneField(Protection, on_delete=models.CASCADE, blank=True, null=True, editable=False)
    team = models.ManyToManyField(Team, blank=True)

    def teams(self):
        mlist = ""
        for team in self.team.all():
            mlist += team.name + ", "
        return mlist

    chapter = models.PositiveSmallIntegerField(blank=False, db_index=True)
    subchapter = models.PositiveSmallIntegerField(default=0, db_index=True)
    volume = models.PositiveSmallIntegerField(blank=True, default=0, db_index=True)
    language = LanguageField(default="en", db_index=True)
    name = models.CharField(max_length=200, blank=True)
    published = models.BooleanField(default=False, db_index=True)
    protected = models.BooleanField(default=False) # TODO get default from settings
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    #published_at = models.DateTimeField(default=timezone.now)
    modified_at = models.DateTimeField(auto_now=True, db_index=True)

    def get_protection(self):
        if self.protected and self.protection:
            return True # TODO real protection val
        return None

    def chapter_decimal(self,):
        chapdig = str(self.chapter)
        if self.subchapter:
            chapdig += "." + str(self.subchapter)
        return chapdig

    def custom_title(self,):
        t = ""
        if self.comic.chapter_title: # FoOlSlide chapter title formatting
            # Generate Ordinal Numbers Suffix (English)
            ordinal = 'th'
            if not (self.chapter % 100) in [11, 12, 13]:
                rem = self.chapter % 10
                if rem is 1:
                    ordinal = 'st'
                elif rem is 2:
                    ordinal = 'nd'
                elif rem is 3:
                    ordinal = 'rd'
            t = self.comic.chapter_title.replace("{num}", self.chapter_decimal()).replace("{ord}", ordinal)
        else:
           t += _("Chapter %s") % self.chapter_decimal()
        return t


    def full_title(self,):
        t = ""
        if self.volume:
            t += _("Vol. %d") % int(self.volume) + " "
        t += _("Chapter %s") % self.chapter_decimal()
        if self.name:
            t += ": " + self.name
        return t
    full_title.short_description = _("Title")

    def simple_title(self,):
        t = self.custom_title()
        if self.name:
            t += ": " + self.name
        return t
    
    def decimal(self,):
        if self.subchapter:
            return str(self.chapter) + "." + str(self.subchapter)
        else:
            return str(self.chapter)

    def path(self, filename):
        # file will be uploaded to MEDIA_ROOT/stuff_below
        return str('{0}' + os.sep + '{1}').format(self.comic.path(self.uniqid), filename)
    #choice_text = models.CharField(max_length=200)
    #votes = models.IntegerField(default=0)

    def manifest(self):
        return reverse('read_uuid_manifest', args=[self.uniqid])

    def __str__(self):
        #return str(self.chapter) + '.' + str(self.subchapter)
        return self.full_title()
    
    def get_absolute_url(self):
        return reverse('read_uuid', args=[self.uniqid])

    #def pages(self):
    #    return Page.objects.filter(chapter=self)

    class Meta:
        ordering = ('-created_at',)

from django.utils.encoding import filepath_to_uri
from django.utils._os import safe_join
from urllib.parse import urljoin
class PageStorage(FileSystemStorage):
    def path(self, name):
        return safe_join(self.location, name)

    def url(self, name):
        if self.base_url is None:
            raise ValueError("This file is not accessible via a URL.")
        url = filepath_to_uri(name)
        if url is not None:
            url = url.lstrip('/')
        return urljoin(self.base_url, url)
    #def get_available_name(self, name):
    #    return name

class Page(models.Model):
    chapter = models.ForeignKey(Chapter, related_name='pages', on_delete=models.CASCADE)

    def path(self, filename):
        return self.chapter.path(str(self.filename))

    file = models.ImageField(storage=PageStorage(), upload_to=path, height_field="height", width_field="width", max_length=200, db_index=True) # I hate that this saves the whole path
    height = models.PositiveSmallIntegerField(null=True, editable=False) # TODO NOT BLANK!
    width = models.PositiveSmallIntegerField(null=True, editable=False) # TODO NOT BLANK!
    mime = models.CharField(max_length=16, null=True, editable=False) # TODO NOT BLANK!
    size = models.PositiveIntegerField(null=True, editable=False) # TODO NOT BLANK!
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    modified_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self):
        return self.filename

    @property
    def filename(self):
        return self.file.name.rsplit('/', 1)[-1]

    def save(self, *args, **kwargs):
        # from pprint import pprint
        # pprint(vars(self.file._file.content_type))
        # print("Mime: " + str(self.mime))
        if self.mime is None:
            try:
                self.mime = self.file._file.content_type
            except Exception as e:
                pass
        super(Page, self).save(*args, **kwargs)

    class Meta:
        ordering = ('file',)