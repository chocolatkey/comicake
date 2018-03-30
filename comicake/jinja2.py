from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import reverse
from django.contrib.flatpages.templatetags.flatpages import get_flatpages
from jinja2 import Environment


def environment(**options):
    env = Environment(**options)
    env.globals.update({
        'static': staticfiles_storage.url,
        'url': reverse,
        'get_flatpages': get_flatpages,
    })
    return env