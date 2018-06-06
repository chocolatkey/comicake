import os
import random
import binascii
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.db.models.fields import CharField
from urllib.parse import urlparse, urlencode

from django.utils.cache import learn_cache_key
from django.core.cache import cache

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

# TODO: Deprecate
def global_settings(request):
    # return any necessary values
    return {
        'DEBUG': settings.DEBUG,
        'SENTRY_DSN': settings.SENTRY_DSN,
        'GA_ID': settings.GA_ID,
        'SITE_TITLE': settings.SITE_TITLE,
        'SITE_DESCRIPTION': settings.SITE_DESCRIPTION,
        'VERSION': settings.VERSION,
        'GENERATOR': settings.GENERATOR,
        'BASE_URL': "http://localhost:8000" if settings.DEBUG else request.scheme + "://" + get_current_site(None).domain, # baka, this is so bad
        'OG_LOCALE': settings.LANGUAGE_CODE.replace("-", "_")
    }

class LanguageField(CharField):
    """
    A language field for Django models.
    From: https://github.com/audiolion/django-language-field
    """
    def __init__(self, *args, **kwargs):
        # Local import so the languages aren't loaded unless they are needed.
        from .languages import LANGUAGES

        kwargs.setdefault('max_length', 5)
        kwargs.setdefault('choices', LANGUAGES)
        super(CharField, self).__init__(*args, **kwargs)

def intru(store, key):
    if key in store:
        if store[key]:
            return True
    return False

def photon(request, path, options={}):
    """
    WP CDN
    - GIF, PNG, JPG
    - Port 80/443
    - Auto WebP conversion based on browser support
    - 10s timeout
    """
    # https://github.com/Automattic/jetpack/blob/master/functions.photon.php#L151
    random.seed(path) # binascii.crc32(str(path).encode('utf-8')) in original
    subdomain = random.randrange(0, 3) # 0-2 
    params = {}
    if intru(options, 'thumb'):
        params["fit"] = "250,250" # Appropriate thumb size
    if intru(options, 'small'):
        params["fit"] = "400,400" # Small size...
    if intru(options, 'hq'):
        params["quality"] = "100"
    
    if path.endswith(".jpg") or path.endswith(".jpeg"):
        params["strip"] = "all"

    url = request.build_absolute_uri("https://i{}.wp.com/{}{}".format(subdomain, request.get_host(), path))
    if len(params) > 0:
        return "{}?{}".format(url, urlencode(params))
    else:
        return url


# TODO: add the other CDNs
# request.build_absolute_uri(PATH)
def cdn_url(request, path, options={}):
    """
    Convert image links to be behind a CDN
    Options: thumb, blur, ...
    """
    if settings.DEBUG:
        return request.build_absolute_uri(path)
    else:
        return photon(request, path, options)

def cacheatron(request, response, keys):
    """
    Cache responses to specific keysets for purging
    :param request: Django request object
    :param reponse: Full response object
    :param keys: Array of keysets to add the cache key to
    :return Response object
    """
    cache_key = learn_cache_key(request, response)
    for key in keys:
        key.add(cache_key)
    return response
