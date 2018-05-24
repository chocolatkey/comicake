# ComiCake

**Please do not try and install, installation flow not complete**

An application (nearly) ready to serve as your next comic reader!
See this page: https://github.com/chocolatkey/comicake/projects/1 for ETA and TODOs

## Setup

Recommended you use a virtualenv
- `python manage.py migrate`
- `python manage.py createsuperuser`

If you want to add an initial set of English tags oriented towards manga, run the command `python manage.py loaddata tags_manga.json`

## Content Protection

TODO explanation

Portions of code from these projects were used in the making of comicake:

## django-admin-multiupload
Original source code by Guilherme Kuhn
 located at https://github.com/gkuhn1/django-admin-multiupload. Heavily modified code used in this application based on the fork by Python Force found here: https://github.com/python-force/django-admin-multiupload/.

## django-language-field
Souce modified to reduce # of languages (affecting page load speed).
Original license below:
```

MIT License

Copyright (c) 2016 Ryan Castner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

TODO add licenses