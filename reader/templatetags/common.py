from django import template
from reader.models import Comic, Chapter
from django.urls import reverse
from django.conf import settings
import random
import binascii
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.humanize.templatetags.humanize import naturalday, naturaltime
from django.utils.translation import gettext as _
register = template.Library()

from datetime import date, datetime
from django.utils.timezone import is_aware, utc
from django.utils.dateformat import format

class SetVarNode(template.Node):

    def __init__(self, var_name, var_value):
        self.var_name = var_name
        self.var_value = var_value

    def render(self, context):
        try:
            value = template.Variable(self.var_value).resolve(context)
        except template.VariableDoesNotExist:
            value = ""
        context[self.var_name] = value

        return u""


@register.tag(name='set')
def set_var(parser, token):
    """
    {% set some_var = '123' %}
    """
    parts = token.split_contents()
    if len(parts) < 4:
        raise template.TemplateSyntaxError("'set' tag must be of the form: {% set <var_name> = <var_value> %}")

    return SetVarNode(parts[1], parts[3])

@register.simple_tag(name='cpath')
def cpath(item):
    """
    {% cpath comic %}
    or
    {% cpath chapter %}
    """
    #parts = token.split_contents()
    #if len(parts) is not 2:
    #    raise template.TemplateSyntaxError("'cpath' tag must be of the form: {% cpath <chapter or comic> %}")
    if type(item) is Comic:
        return reverse('series', kwargs={'series_slug': item.slug})
    elif type(item) is Chapter:
        return reverse('read_uuid', kwargs={'cid': item.uniqid})
    else:
        raise template.TemplateSyntaxError("cpath argument not of type Comic or Chapter")

@register.filter(name='ago')
def ago(value):
    if not isinstance(value, date):  # datetime is a subclass of date
        return value
    now = datetime.now(utc if is_aware(value) else None)
    delta = now - value
    if value < now:
        if delta.days > 3:
            return format(value, 'Y.m.d')
    return naturaltime(value)

@register.tag(name='setting')
def setting(parser, token):
    try:
        # split_contents() knows not to split quoted strings.
        tag_name, var = token.split_contents()
    except ValueError:
        raise template.TemplateSyntaxError("%r tag requires a single argument" % token.contents.split()[0])
    return ValueFromSettings(var)

class ValueFromSettings(template.Node):
    def __init__(self, var):
        self.arg = template.Variable(var)
    def render(self, context):        
        return settings.__getattr__(str(self.arg))

@register.simple_tag(name='tt')
def tt(item):
    if type(item) is Comic:
        title = item.name
        if item.alt:
            title += " ({})".format(item.alt)
    elif type(item) is str:
        title = _(item)
    else:
        title = str(item)
    return "{} :: {}".format(title, settings.SITE_TITLE)

#############

def cdn_url(path):
    # https://github.com/Automattic/jetpack/blob/master/functions.photon.php#L151
    random.seed(binascii.crc32(str(path).encode('utf-8')))
    subdomain = random.randrange(0, 3) # 0-2
    return "https://i{}.wp.com/{}".format(subdomain, path) # TODO FIX STATIC!

@register.simple_tag(name='icdn')
def icdn(item):
    """
    Image CDN
    Example: {% icdn '/static/static_img.png' %}
    """
    if settings.DEBUG:
        return item
    else:
        return cdn_url(get_current_site(None).domain + item)