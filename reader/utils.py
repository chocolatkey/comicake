import os
from django.conf import settings

def file_cleanup(sender, **kwargs):
    print(sender)
    print(kwargs)
'''
for fieldname in sender._meta.get_all_field_names():
    try:
        field = sender._meta.get_field(fieldname)
    except:
        field = None
        if field and isinstance(field, FileField):
            inst = kwargs['instance']
            f = getattr(inst, fieldname)
            m = inst.__class__._default_manager
            if hasattr(f, 'path') and os.path.exists(f.path)\
            and not m.filter(**{'%s__exact' % fieldname: getattr(inst, fieldname)})\
            .exclude(pk=inst._get_pk_val()):
            try:
                default_storage.delete(f.path)
            except:
                pass
'''

def global_settings(request):
    # return any necessary values
    return {
        'DEBUG': settings.DEBUG,
        'SENTRY_DSN': settings.SENTRY_DSN,
        'GA_ID': settings.GA_ID,
        'SITE_TITLE': settings.SITE_TITLE,
        'GENERATOR': "{} v{}".format(settings.APP_NAME, settings.VERSION)
    }