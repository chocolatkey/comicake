from django.contrib import admin
from .models import Comic, Tag, Chapter, Team, Page, Person, Licensee

from django.utils.translation import gettext as _
from django.utils.safestring import mark_safe
from django.db import models
from django.contrib.admin.widgets import AdminFileWidget
from django.conf import settings
import os
from .MultiUploadAdmin import MultiUploadAdmin
from django.shortcuts import get_object_or_404
from django.utils.html import format_html
from django.shortcuts import redirect

from django.urls import reverse

def make_published(modeladmin, request, queryset):
    updates = queryset.update(published=True)
    if updates == 1:
        message_bit = _("item was")
    else:
        message_bit = _("%s items were") % updates
    modeladmin.message_user(request, _("%s successfully published.") % message_bit)
make_published.short_description = _("Publish selected items")

def make_unpublished(modeladmin, request, queryset):
    updates = queryset.update(published=False)
    if updates == 1:
        message_bit = _("item was")
    else:
        message_bit = _("%s items were") % updates
    modeladmin.message_user(request, _("%s successfully unpublished.") % message_bit)
make_unpublished.short_description = _("Unpublish selected items")

class AdminImageWidget(AdminFileWidget):
    def render(self, name, value, attrs=None, renderer=None):
        output = []
        if value and getattr(value, "url", None):
            image_url = os.path.join(settings.MEDIA_URL, value.url)
            file_name=str(value)
            output.append(u' <a href="%s" target="_blank"><img src="%s" alt="%s" width="150" height="150"  style="object-fit: contain;"/></a> %s ' % \
            (image_url, image_url, file_name, _('Page')))
        output.append(super(AdminFileWidget, self).render(name, value, attrs, renderer))
        return mark_safe(u''.join(output))

class AdminThumbWidget(AdminFileWidget):
    def render(self, name, value, attrs=None, renderer=None):
        output = []
        if value and getattr(value, "url", None):
            image_url = os.path.join(settings.MEDIA_URL, value.url)
            file_name=str(value).rsplit('/')[-1]
            output.append(u' <a href="%s" target="_blank"><img src="%s" alt="%s" width="150" height="150"  style="object-fit: contain;"/></a> %s ' % \
            (image_url, image_url, file_name, _('Page')))
        else:
            output.append(super(AdminFileWidget, self).render(name, value, attrs, renderer))
        return mark_safe(u''.join(output))

class PageInlineAdmin(admin.TabularInline):
    list_display = ('file',)
    extra = 0
    model = Page
    formfield_overrides = {models.ImageField: {'widget': AdminThumbWidget}}
    template = "admin/edit_inline/pages.html"

class ChapterMultiuploadMixing(object):
    def process_uploaded_file(self, uploaded, chapter, request):
        '''
        from pprint import pprint
        pprint(vars(uploaded))
        '''
        if chapter:
            page = chapter.pages.create(file=uploaded, mime=uploaded.content_type, size=uploaded.size)
        else:
            # Something went horribly wrong. TODO: Raie some kind of exception
            page = Page.objects.create(file=uploaded, chapter=None)
        return {
            'url': page.file.url,
            'thumbnailUrl': page.file.url,
            'id': page.id,
            'name': page.filename
        }

class ChapterAdmin(ChapterMultiuploadMixing, MultiUploadAdmin):
    inlines = [PageInlineAdmin,]
    multiupload_form = True
    multiupload_list = False
    multiupload_maxfilesize = 50 * 2 ** 20 # 50 Mb max image size
    ordering = ('-modified_at',)
    actions = [make_published, make_unpublished]
    save_on_top = True


    def comic_link(self, obj):
        url = reverse('admin:reader_comic_change', args=[obj.comic_id])
        return format_html("<a href='{}'>{}</a>", url, obj.comic)
    comic_link.admin_order_field = 'Comic'
    comic_link.short_description = 'Comic'

    list_display = ('full_title', 'comic_link', 'teams', 'published_at', 'modified_at', 'language', 'published')
    #list_editable = ('team',)
    readonly_fields = ('uniqid', 'protected')
    list_display_links = ('full_title',)
    list_filter = ('comic', 'published', 'team') # todo: protection enabled also 'language' too big
    autocomplete_fields = ['comic', 'team']

    def delete_file(self, pk, request):
        '''
        Delete an image.
        '''
        obj = get_object_or_404(Page, pk=pk)
        return obj.delete()

    def get_formsets_with_inlines(self, request, obj=None):
        for inline in self.get_inline_instances(request, obj):
            if isinstance(inline, PageInlineAdmin) and obj is None:
                continue
            yield inline.get_formset(request, obj), inline

    def response_add(self, request, obj, post_url_continue=None):
        if not ("comic" in request.GET.keys()):
            return super().response_add(request, obj, post_url_continue=post_url_continue)
        return redirect(reverse('admin:reader_comic_change', args=(request.GET.get('comic'),)))
    '''
    def response_change(request, obj):
        if not ("comic" in request.GET.keys()):
            return super().response_add(request, obj)
        return redirect(reverse('admin_reader_comic_change', args=(request.GET.get('comic'),)))
    '''
    def get_queryset(self, request):
        return super(ChapterAdmin, self).get_queryset(request).select_related('comic').prefetch_related('team')

class PageAdmin(ChapterMultiuploadMixing, MultiUploadAdmin):
    list_display = ('file',)
    multiupload_form = False
    multiupload_list = True

admin.site.register(Chapter, ChapterAdmin)
#admin.site.register(Page, PageAdmin)

class ChapterInlineAdmin(admin.TabularInline):
    model = Chapter
    extra = 0
    max_num = 0
    show_change_link = True
    readonly_fields = ('full_title', 'modified_at', 'protected')
    fields = ('full_title', 'published', 'protected', 'modified_at')

class ComicAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'alt', 'author', 'artist', 'tags', 'description', 'published', 'format', 'cover')}),
        (_('Advanced'), {
            'classes': ('collapse', ),
            'fields': (
                'adult',
                'chapter_title',
                'created_at',
                'modified_at',
            ),
        }),
    )
    inlines = [
        ChapterInlineAdmin,
    ]
    readonly_fields = ('uniqid',)
    ordering = ('-created_at',)
    actions = [make_published, make_unpublished]
    save_on_top = True

    list_display = ('thumb', 'name', 'authors', 'artists', 'published')
    #list_editable = ('published',)
    list_display_links = ('thumb', 'name')
    list_filter = ('published', 'format') #'author', 'artist', 
    formfield_overrides = {models.ImageField: {'widget': AdminImageWidget}}
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ['name']
    autocomplete_fields = ['author', 'artist', 'tags', 'licenses']
    readonly_fields = ('created_at', 'modified_at')
    def get_formsets_with_inlines(self, request, obj=None):
        for inline in self.get_inline_instances(request, obj):
            if isinstance(inline, ChapterInlineAdmin) and obj is None:
                continue
            yield inline.get_formset(request, obj), inline

    def get_queryset(self, request):
        return super(ComicAdmin, self).get_queryset(request).prefetch_related('author', 'artist')

admin.site.register(Comic, ComicAdmin)

class PersonAdmin(admin.ModelAdmin):
    search_fields = ['name', 'alt']
admin.site.register(Person, PersonAdmin)

class LicenseeAdmin(admin.ModelAdmin):
    search_fields = ['name']
admin.site.register(Licensee, LicenseeAdmin)

class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ['name', 'description']
    prepopulated_fields = {"slug": ("name",)}
admin.site.register(Tag, TagAdmin)

class TeamAdmin(admin.ModelAdmin):
    def name_with_icon(self, obj):
        if obj.id == settings.HOME_TEAM:
            return "🏠 " + obj.name
        else:
            return obj.name
    list_display = ('name_with_icon', 'description')
    search_fields = ['name', 'description']
    autocomplete_fields = ['members']
admin.site.register(Team, TeamAdmin)
'''
class JointAdmin(admin.ModelAdmin):
    search_fields = ['members']

admin.site.register(Joint, JointAdmin)
'''