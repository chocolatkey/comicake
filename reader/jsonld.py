from django.utils.translation import gettext as _
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from .utils import cdn_url

# TODO: make this a nice class sometime

def chapterManifest(request, chapter):
    '''
    Reference at https://github.com/readium/webpub-manifest/tree/master/contexts/default
    https://github.com/HadrienGardeur/comics-manifest

    https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL2NoaWxkcmVucy1saXRlcmF0dXJlLmVwdWI=/manifest.json
    https://readium2.herokuapp.com/pub/L2FwcC9taXNjL2VwdWJzL2NoaWxkcmVucy1saXRlcmF0dXJlLmVwdWI%3D/manifest.json/show/all
    https://gist.github.com/HadrienGardeur/03ab96f5770b0512233a
    https://github.com/readium/webpub-manifest/blob/master/contexts/default/context.jsonld
    https://github.com/readium/webpub-manifest/tree/master/contexts/default
    '''
    pages = chapter.pages.all()
    manifest = {
        "@context": "http://readium.org/webpub/default.jsonld",
        "metadata": {
            "@type": "ComicIssue",
            "identifier": "urn:uuid:" + str(chapter.uniqid),
            "issueNumber": chapter.decimal(),
            "name": chapter.simple_title(),
            "subtitle": chapter.full_title(),
            "author": [],
            "artist": [],
            "accessMode": "visual",
            "accessibilityControl": ["fullKeyboardControl", "fullMouseControl", "fullTouchControl"],
            "isAccessibleForFree": True,
            "protection": chapter.get_protection(),
            "accessibilitySummary":  _("Protected content") if chapter.protected else _("Sequence of images containing drawings with text"),
            "provider": settings.GENERATOR,
            "publisher": [],
            "description": chapter.comic.description,
            # if chapter.comic.alt %}"alternateName": "{{ chapter.comic.alt }}",{% endif %}
            "published": chapter.created_at.isoformat(),
            "modified": chapter.modified_at.isoformat(),
            "language": chapter.language,
            "subject": [],
            "belongs_to": {
                "series": {
                    "name": chapter.comic.name,
                    "slug": chapter.comic.slug,
                    "identifier": request.build_absolute_uri(chapter.comic.get_absolute_url()),
                    "position": chapter.decimal()
                }
            },
            "numberOfPages": len(pages)
        },
        "links": [
            {"rel": "self", "href": request.build_absolute_uri(), "type": "application/webpub+json"},
            {"rel": "alternate", "href": request.build_absolute_uri(reverse('read_uuid', args=[chapter.uniqid])), "type": "text/html"},
            #{"rel": "alternate", "href": "TODO", "type": "application/vnd.comicbook+zip"}
        ],
        "spine": []
    }

    if chapter.comic.cover:
        manifest['metadata'].update({
            "image": cdn_url(request, chapter.comic.cover.url),
            "thumbnailUrl": cdn_url(request, chapter.comic.cover.url, {'thumb': True})
        })

    # Pages
    for page in pages:
        manifest['spine'].append({
            "href": request.build_absolute_uri(page.file.url), # Leave CDN issue up to JS: cdn_url(request, page.file.url, {'hq': True})
            "type": page.mime,
            "height": page.height,
            "width": page.width,
            # "properties": {"page": "right"},
            # "title": "Cover"
        })

    # Volume
    if chapter.volume:
        manifest['metadata']['belongs_to']['collection'] = {
            "name": _("Volume %d") % chapter.volume,
            "identifier": chapter.volume # TODO IMPROVE
        }

    # Artists
    for person in chapter.comic.author.all():
        pjson = {
            "@type": "Person",
            "name": person.name,
            "identifier": str(person.id),
            "url": request.build_absolute_uri(reverse('person', args=[person.id]))
        }
        if person.alt:
            pjson['alternateName'] = person.alt
        manifest['metadata']['author'].append(pjson)

    # Artists
    for person in chapter.comic.artist.all():
        pjson = {
            "@type": "Person",
            "name": person.name,
            "identifier": str(person.id),
            "url": request.build_absolute_uri(reverse('person', args=[person.id]))
        }
        if person.alt:
            pjson['alternateName'] = person.alt
        manifest['metadata']['artist'].append(pjson)

    # "Publishers"
    for team in chapter.team.all():
        manifest['metadata']['publisher'].append({
            "name": team.name,
            "identifier": request.build_absolute_uri(reverse('team', args=[team.id]))
        })

    # Subjects a.k.a Tags/Genres
    for tag in chapter.comic.tags.all():
        manifest['metadata']['subject'].append(tag.name)

    return manifest

def websiteBase(request):
    return {
        "@context": "http://schema.org",
        "@type": "WebPage",
        "potentialAction": {
            "@type": "SearchAction",
            "target": request.build_absolute_uri(reverse('search')) + "?q={search_term_string}",
            "query-input": "required name=search_term_string"
        },
        "breadcrumb":{
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "item": get_current_site(request).name
            }]
        },	
        "mainEntity":{}
    }

def personLd(request, person):
    me = websiteBase(request)
    me["breadcrumb"]["itemListElement"].append({
        "@type": "ListItem",
        "position": 2,
        "item": person.name
    })

    # TODO maybe their works?

    me["mainEntity"] = {
        "@type": "Person",
        "@id": request.build_absolute_uri()
    }

    if person.alt:
        me["mainEntity"]["name"] = person.alt
        me["mainEntity"]["alternateName"] = person.name
    else:
        me["mainEntity"]["name"] = person.name

    return me

def teamLd(request, team):
    me = websiteBase(request)
    me["breadcrumb"]["itemListElement"].append({
        "@type": "ListItem",
        "position": 2,
        "item": team.name
    })

    members = [] # muh nakama
    for user in team.members.all():
        members.append({
            "@type": "Person",
            "name": user.username
        })

    me["mainEntity"] = {
        "@type": "Organization",
        "@id": request.build_absolute_uri(),
        "name": team.name,
        "description": team.description,
        "members": members,
        #"seeks": {
        #    "@type": "Demand",
        #    "name": "Members",
        #    "sameAs": "https://en.wikipedia.org/wiki/Slave" # Triggered?
        #}
    }
    return me

def comicLd(request, comic):
    me = websiteBase(request)
    me["breadcrumb"]["itemListElement"].append({
        "@type": "ListItem",
        "position": 2,
        "item": comic.name
    })

    authors = []
    for person in comic.author.all():
        dta = {
            "@type": "Person",
            "name": person.name,
            "identifier": person.id,
            "url": reverse("person", args=[person.id])
        }
        if person.alt:
            dta["alternateName"] = person.alt
        authors.append(dta)

    artists = []
    for person in comic.artist.all():
        dta = {
            "@type": "Person",
            "name": person.name,
            "identifier": person.id,
            "url": reverse("person", args=[person.id])
        }
        if person.alt:
            dta["alternateName"] = person.alt
        artists.append(dta)

    copyrightHolders = []
    for licensee in comic.licenses.all():
        copyrightHolder = {
            "@type": "Organization",
            "name": licensee.name,
        }
        if licensee.homepage:
            copyrightHolder["url"] = licensee.homepage
        if licensee.logo:
            copyrightHolder["logo"] = cdn_url(request, licensee.logo.url)
        copyrightHolders.append(copyrightHolder)

    genres = []
    for tag in comic.tags.all():
        genres.append(tag.name)

    me["mainEntity"] = {
        "@type": "ComicSeries",
        "identifier": "urn:uuid:{}".format(comic.uniqid),
        "provider": settings.GENERATOR,
        "name": comic.name,
        "about": comic.description,
        "author": authors,
        "creator": artists,
        "dateCreated": comic.created_at.isoformat(),
        "dateModified": comic.modified_at.isoformat(),
        "genre": genres,
        "copyrightHolder": copyrightHolders
    }

    if comic.alt:
        me["mainEntity"]["alternateName"] = comic.alt
    if comic.cover:
        me["mainEntity"]["image"] = cdn_url(request, comic.cover.url)
        me["mainEntity"]["thumbnailUrl"] = cdn_url(request, comic.cover.url, {'thumb': True})

    return me

def chapterLd(request, chapter):
    me = websiteBase(request)
    position = 2
    me["breadcrumb"]["itemListElement"].append({
        "@type": "ListItem",
        "position": position,
        "item": chapter.comic.name
    })
    position += 1
    if chapter.volume:
        me["breadcrumb"]["itemListElement"].append({
            "@type": "ListItem",
            "position": position,
            "item": _("Vol. %s") % chapter.volume
        })
        position += 1
    me["breadcrumb"]["itemListElement"].append({
        "@type": "ListItem",
        "position": position,
        "item": chapter.simple_title()
    })

    authors = []
    for person in chapter.comic.author.all():
        dta = {
            "@type": "Person",
            "name": person.name,
            "identifier": person.id,
            "url": reverse("person", args=[person.id])
        }
        if person.alt:
            dta["alternateName"] = person.alt
        authors.append(dta)

    artists = []
    for person in chapter.comic.artist.all():
        dta = {
            "@type": "Person",
            "name": person.name,
            "identifier": person.id,
            "url": reverse("person", args=[person.id])
        }
        if person.alt:
            dta["alternateName"] = person.alt
        artists.append(dta)
    
    copyrightHolders = []
    for licensee in chapter.comic.licenses.all():
        copyrightHolder = {
            "@type": "Organization",
            "name": licensee.name,
        }
        if licensee.homepage:
            copyrightHolder["url"] = licensee.homepage
        if licensee.logo:
            copyrightHolder["logo"] = cdn_url(request, licensee.logo.url)
        copyrightHolders.append(copyrightHolder)

    genres = []
    for tag in chapter.comic.tags.all():
        genres.append(tag.name)

    me["mainEntity"] = {
        "@type": "ComicIssue",
        "identifier": "urn:uuid:{}".format(chapter.uniqid),
        "name": chapter.simple_title(),
        "alternativeHeadline": chapter.full_title(),
        "author": authors,
        "artist": artists,
        "accessMode": "visual",
        "accessibilityControl": ["fullKeyboardControl", "fullMouseControl", "fullTouchControl"],
        "isAccessibleForFree": True,
        "provider": settings.GENERATOR,
        "copyrightHolders": copyrightHolders,
        "publisher": [],
        "description": chapter.comic.description,
        "dateCreated": chapter.comic.created_at.isoformat(),
        "dateModified": chapter.comic.modified_at.isoformat(),
        "inLanguage": chapter.language,
        "genre": genres
    }

    if chapter.comic.cover:
        me["mainEntity"]["image"] = cdn_url(request, chapter.comic.cover.url)
        me["mainEntity"]["thumbnailUrl"] = cdn_url(request, chapter.comic.cover.url, {'thumb': True})

    for team in chapter.team.all():
        me['mainEntity']['publisher'].append({
            "name": team.name,
            "identifier": request.build_absolute_uri(reverse('team', args=[team.id]))
        })
    
    

    return me