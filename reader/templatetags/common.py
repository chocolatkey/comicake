from django import template
from reader.models import Comic, Chapter, Person, Team
from blog.models import Post, Page
from django.contrib.auth.models import User
from django.urls import reverse
from django.conf import settings
from django.contrib.humanize.templatetags.humanize import naturalday, naturaltime
from django.utils.translation import gettext as _
from django.utils.safestring import mark_safe
register = template.Library()

from datetime import date, datetime
from django.utils.timezone import is_aware, utc
from django.utils.dateformat import format
from reader.utils import cdn_url
from reader.jsonld import chapterLd, comicLd, teamLd, personLd, postLd, pageLd, chapterReadingOrder, comicFormat
from django.contrib.sites.shortcuts import get_current_site

import json
import hashlib

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

@register.simple_tag(name='spine')
def spine(request, pages):
    return json.dumps(chapterReadingOrder(request, pages))

@register.simple_tag(name='comic_progression')
def comic_progression(comic):
    return comicFormat(comic)

@register.simple_tag(name='jsonld')
def jsonld(request, item):
    """
    {% jsonld object %}
    """
    if type(item) is Comic:
        jsonld = comicLd(request, item)
    elif type(item) is Chapter:
        jsonld = chapterLd(request, item)
    elif type(item) is Team:
        jsonld = teamLd(request, item)
    elif type(item) is Person:
        jsonld = personLd(request, item)
    elif type(item) is Post:
        jsonld = postLd(request, item)
    elif type(item) is Page:
        jsonld = pageLd(request, item)
    else:
        raise template.TemplateSyntaxError("Object of type {} does not have a JSON-LD equivalent".format(type(item).__name__))
    indent = 4 if settings.DEBUG else None
    return mark_safe(json.dumps(jsonld, indent=indent))

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
def tt(request, item):
    if type(item) is Comic:
        title = item.name
        if item.alt:
            title += " ({})".format(item.alt)
    if type(item) is Chapter:
        title = "{} :: {}".format(item.comic.name, _("Chapter %d") % item.chapter) # TODO: handle chap is a vol.
    elif type(item) is Person:
        title = item.name
    elif type(item) is Team:
        title = "{} :: {}".format(_("Teams"), item.name)
    elif type(item) is str:
        title = _(item)
    else:
        title = str(item)
    return "{} :: {}".format(title, get_current_site(request).name)

@register.simple_tag(name='gravatar')
def gravatar(user):
    gravatar_url = "https://www.gravatar.com/avatar/{}?s=300&d=mm&r=g" # Size 300, mysteryman fallback, g-rated pics
    if type(user) is not User:
        raise template.TemplateSyntaxError("Gravatar tag requires a user")
    if user.email:
        # Yes, I am aware that this exposes staff user emails in md5 hashed form,
        # but if you are truly concerned about your email being compromised, either
        # don't add it to your profile or...don't use that private email with your account!
        # (also there's really no other service out there that does what gravatar does ;()
        return gravatar_url.format(hashlib.md5(user.email.lower().strip().encode('utf-8')).hexdigest())
    else:
        # Blank email, returns "Myster Man"
        return gravatar_url.format("")

@register.simple_tag(name='page_button_range', takes_context=True)
def page_button_range(context, count, current):
    val = current + 2
    start = count if val >= count else val
    context['pbrange'] = range(start, max(0, current - 3), -1)
    return ""

@register.simple_tag(name='azpad')
def azpad(count, current):
    if count / 100 > 1 and current / 100 < 1:
        return "00{}".format(current)
    elif count / 10 > 1 and current / 10 < 1:
        return "0{}".format(current)
    else:
        return current

@register.filter
def index(List, i):
    if(len(List) < (i + 1)):
        return None
    return List[int(i)]

#############

@register.simple_tag(name='icdn', takes_context=True)
def icdn(context, item, *args, **kwargs):
    """
    Image CDN
    Example: {% icdn '/static/static_img.png' %}
    """
    if 'options' in kwargs:
        options = json.loads(kwargs['options'])
    else:
        options = {}
    return cdn_url(context['request'], item, options)

#############