# pylint: disable=E1101
from django.db import models
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.safestring import mark_safe
from django.contrib.auth.models import User
from languages.fields import LanguageField
from django.utils import timezone
from datetime import timedelta
import uuid
import os
from django.db.models.signals import post_delete
from .utils import file_cleanup
from django.utils.translation import gettext as _
from django.urls import reverse
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

class Person(models.Model):
    class Meta:
        verbose_name_plural = "people"
    name = models.CharField(max_length=100, unique=True)
    alt = models.CharField(max_length=100, blank=True, help_text=_('Name in native language'))
    def __str__(self):
        return self.name

class Comic(models.Model):
    name = models.CharField(max_length=200)
    uniqid = models.UUIDField(_("Unique ID"), unique=True, default=uuid.uuid4, editable=False, help_text=_("Filesystem identifier for this object"))
    slug = models.SlugField(unique=True, help_text=_("Changing this will break URLs"), max_length=50)
    alt = models.CharField(_('Alternate title'), blank=True, help_text=_('The original title, or title in another language'), max_length=200)
    author = models.ManyToManyField(Person, blank=True, related_name='%(class)s_comic_author')
    artist = models.ManyToManyField(Person, blank=True, related_name='%(class)s_comic_artist')
    tags = models.ManyToManyField(Tag, blank=True)
    description = models.TextField(_("Synopsis"), blank=True)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
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
    
    class Meta:
        ordering = ('name',)
post_delete.connect(file_cleanup, sender=Comic, dispatch_uid="comic.file_cleanup")

class Team(models.Model):
    name = models.CharField(max_length=256)
    slug = models.SlugField(unique=True, help_text=_("Changing this may break URLs"), max_length=20)
    members = models.ManyToManyField(User, blank=True)
    description = models.TextField(blank=True)   
    def __str__(self):
        return self.name
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
    def default_expiry(self):
        return timezone.now() + timedelta(days=1)
    key = models.CharField(max_length=256)
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
    #joint = models.ForeignKey(Joint, on_delete=models.SET_NULL, null=True, blank=True)
    chapter = models.PositiveSmallIntegerField(blank=False)
    subchapter = models.PositiveSmallIntegerField(default=0)
    volume = models.PositiveSmallIntegerField(blank=True, default=0)
    language = LanguageField(default="en")
    name = models.CharField(max_length=200, blank=True)
    published = models.BooleanField(default=True)
    protected = models.BooleanField(default=False) # TODO get default from settings
    created_at = models.DateTimeField(auto_now_add=True)
    #published_at = models.DateTimeField(default=timezone.now)
    modified_at = models.DateTimeField(auto_now=True)

    def full_title(self,):
        #t = self.comic.name + " -"
        t = ""
        if self.volume:
            t += _("Vol. %d ") % int(self.volume)
        t += _("Chapter %s") % self.chapter
        if self.subchapter:
            t += "." + str(self.subchapter)
        if self.name:
            t += ": " + self.name
        return t
    full_title.short_description = _("Title")

    def simple_title(self,):
        t = ""
        if self.name:
            t = self.name
        else:
            t = _("Chapter %d") % self.chapter
        return t

    def path(self, filename):
        # file will be uploaded to MEDIA_ROOT/stuff_below
        return str('{0}' + os.sep + '{1}').format(self.comic.path(self.uniqid), filename)
    #choice_text = models.CharField(max_length=200)
    #votes = models.IntegerField(default=0)
    def __str__(self):
        #return str(self.chapter) + '.' + str(self.subchapter)
        return self.full_title()
    
    def get_absolute_url(self):
        return reverse('read_uuid', args=[self.uniqid])

    class Meta:
        ordering = ('-created_at',)

class Page(models.Model):
    chapter = models.ForeignKey(Chapter, related_name='pages', on_delete=models.CASCADE)
    def path(self, filename):
        return self.chapter.path(str(self.filename))
    file = models.ImageField(upload_to=path)
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

    class Meta:
        ordering = ('file',)