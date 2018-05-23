from django.contrib import admin
from django.contrib.flatpages.admin import FlatPageAdmin
from django.contrib.flatpages.models import FlatPage
from .models import Post, Page
from .forms import ExtendedFlatPageForm, PostAdminForm
from django.utils.translation import gettext_lazy as _
from reader.admin import make_published, make_unpublished

class ExtendedFlatPageAdmin(FlatPageAdmin):
    form = ExtendedFlatPageForm
    fieldsets = (
        (None, {'fields': ('url', 'title', 'content', 'sites')}),
        (_('Advanced options'), {
            'classes': ('collapse', ),
            'fields': (
                'enable_comments',
                'registration_required',
                'template_name',
            ),
        }),
    )
admin.site.unregister(FlatPage)
admin.site.register(Page, ExtendedFlatPageAdmin)

class PostAdmin(admin.ModelAdmin):
    form = PostAdminForm
    list_display = ('title', 'author', 'published', 'created_at')
    readonly_fields = ('author', 'created_at', 'modified_at')
    search_fields = ['title', 'content']
    prepopulated_fields = {"slug": ("title",)}
    actions = [make_published, make_unpublished]
    def save_model(self, request, obj, form, change):
        if not change:
            obj.author = request.user
        obj.save()
admin.site.register(Post, PostAdmin)
