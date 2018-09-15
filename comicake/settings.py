"""
Django settings for comicake project.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.0/howto/deployment/checklist/
"""

import os
from django.contrib import admin
import raven

'''
STOP!

Are you setting ComiCake up with your own settings? Place a file named "local_settings.py"
in the root folder (one directory up from here) and add settings there. You can copy every line
below in the "Important configuration" section to start with. Leave out stuff you don't change.
'''
###########################################
### Important configuration vars ##########
###########################################
# Frontend config. Should be declared in frontend_settings.ini!
FRONTEND_CONFIG = {
    "theme": {
        "name": "material" # Site's template theme directory
    },
    "paths": {
        # Should have trailing slashes. Make sure to apply in JS too!
        # TODO apply through ini in webpack
        "admin": "a/",
        "api": "api/",
        "reader": "r/", # Could be set to just '/' to make reader primary app
    }
}
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
try:
    import configparser
    config = configparser.ConfigParser()
    config.read(os.path.join(BASE_DIR, 'frontend_settings.ini'))
    FRONTEND_CONFIG.update(config)
except Exception as e:
    print("Error reading frontend settings file!")
    print(e)

DEBUG = True # SECURITY WARNING: don't run with debug turned on in production!
SITE_TITLE = 'ComiCake' # Your site's title
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]'] # Add your domain
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Los_Angeles'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') # For reverse proxying
## Services
GA_ID = None # Google Analytics ID (starts with "UA-")
SENTRY_DSN = None # e.g. https://abc:123@sentry.example.com/1
SECRET_KEY = 'GENERATE_YOUR_OWN_VERY_IMPORTANT!' # SECURITY WARNING: keep the secret key used in production secret!
## Paths & Static files # https://docs.djangoproject.com/en/2.0/howto/static-files/
STATIC_URL = '/static/' # Set to absolute path of nginx/apache mapped static dir!
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')
MEDIA_URL = os.path.join(STATIC_URL, 'media/')
MEDIA_ROOT = BASE_DIR + MEDIA_URL
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'frontend', '_common', 'assets'),
    os.path.join(BASE_DIR, 'frontend', FRONTEND_CONFIG["theme"]["name"], 'assets')
    #os.path.join(BASE_DIR, 'static'),
)
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)
FILE_UPLOAD_PERMISSIONS = 0o644
## DB
# Recommended you switch off sqlite in production!
DATABASES = { # Database (https://docs.djangoproject.com/en/2.0/ref/settings/#databases)
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}
## Caching
# Recommended you switch to memcached or file cache in production!
XCACHE = 'django.core.cache.backends.locmem.LocMemCache'
XCACHELOC = None

if DEBUG:
    CACHE_SHORT = 0
    CACHE_MEDIUM = 0
    CACHE_LONG = 0
else:
    CACHE_SHORT = 60
    CACHE_MEDIUM = 300
    CACHE_LONG = 3600

## Comic stuff
PROTECTION = {
    "download": False, # False for no DL, true for always DL, otherwise a time in seconds after publish date to allow
    "captcha": False, # ReCaptcha key or False for no captcha required
}

###########################################
### Don't touch anything below this! ######
###########################################

# Get settings from the backend settings file users should be using
try:
    from backend_settings import *
except ImportError:
    pass

VERSION = "0.11.1"
APP_NAME = 'ComiCake' # Pls no change kthx

ADMIN_LOGO = 'img/logo.svg'
MENU_WEIGHT = {
    'Reader': 1,
    'Blog': 2,
}
ADMIN_STYLE = {
    'primary-color': '#111',
    'secondary-color': '#527885',
    'secondary-text': 'white',
    'tertiary-color': '#a4bdc4',
    #'tertiary-text': 'blue', TODO tertiary hover is same as tertiary
    'primary-button': '#1e434f',
    'secondary-button': '#44717f',
    'link-color': '#447e9b',
    }
'''
ADMIN_STYLE = {
    'background': 'white',
    'primary-color': '#205280',
    'primary-text': '#d6d5d2',
    'secondary-color': '#3B75AD',
    'secondary-text': 'white',
    'tertiary-color': '#F2F9FC',
    'tertiary-text': 'black',
    'breadcrumb-color': 'whitesmoke',
    'breadcrumb-text': 'black',
    'focus-color': '#eaeaea',
    'focus-text': '#666',
    'primary-button': '#26904A',
    'primary-button-text':' white',
    'secondary-button': '#999',
    'secondary-button-text': 'white',
    'link-color': '#333',
    'link-color-hover': 'lighten($link-color, 20%)'
}
'''
GENERATOR = "{} v{}".format(APP_NAME, VERSION)

CACHES = {
    'default': {
        'BACKEND': XCACHE,
        'LOCATION': XCACHELOC,
    }
}
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Application definition
RAVEN_CONFIG = { # Sentry config for error reports
    #'dsn-frontend': 'TODO',
    'dsn': SENTRY_DSN,
    # If you are using git, you can also automatically configure the
    # release based on the git info.
    'release': raven.fetch_git_sha(BASE_DIR),
}

INSTALLED_APPS = [
    'raven.contrib.django.raven_compat',
    'reader.apps.ReaderConfig',
    'blog.apps.BlogConfig', # TODO add setting to enable/disable this
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.flatpages',
    'django.contrib.humanize',
    'django.contrib.sitemaps',
    'rest_framework',
    'django_filters',
    'django_cleanup',
    'webpack_loader',
    #'dynamic_preferences',
    #'dynamic_preferences.users.apps.UserPreferencesConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'blog.middleware.FlatpageFallbackMiddleware', # todo optional
]

if DEBUG:
    INSTALLED_APPS.append('debug_toolbar')
    MIDDLEWARE.append('debug_toolbar.middleware.DebugToolbarMiddleware')

ROOT_URLCONF = 'comicake.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'frontend', '_common', 'templates'), #/site
            os.path.join(BASE_DIR, 'frontend', FRONTEND_CONFIG["theme"]["name"], 'templates')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                #'dynamic_preferences.processors.global_preferences',
                'django.template.context_processors.i18n',
                'reader.utils.global_settings'
            ],
            'libraries': {
                'custom_admin_css': 'comicake.templatetags.custom_admin_css',
                'custom_admin_logo': 'comicake.templatetags.custom_admin_logo',
                'custom_admin_menu': 'comicake.templatetags.custom_admin_menu',
            },
        },
    },
]

# Django Preferences addon settings
DYNAMIC_PREFERENCES = {

    # a python attribute that will be added to model instances with preferences
    # override this if the default collide with one of your models attributes/fields
    'MANAGER_ATTRIBUTE': 'preferences',

    # The python module in which registered preferences will be searched within each app
    'REGISTRY_MODULE': 'preferences',

    # Allow quick editing of preferences directly in admin list view
    # WARNING: enabling this feature can cause data corruption if multiple users
    # use the same list view at the same time, see https://code.djangoproject.com/ticket/11313
    'ADMIN_ENABLE_CHANGELIST_FORM': DEBUG,

    # Customize how you can access preferences from managers. The default is to
    # separate sections and keys with two underscores. This is probably not a settings you'll
    # want to change, but it's here just in case
    'SECTION_KEY_SEPARATOR': '__',

    # Use this to disable caching of preference. This can be useful to debug things
    'ENABLE_CACHE': (not DEBUG),

    # Use this to disable checking preferences names. This can be useful to debug things
    'VALIDATE_NAMES': DEBUG,
}

WSGI_APPLICATION = 'comicake.wsgi.application'


# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

if not DEBUG:
    # Application Logging
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': True,
        'formatters': {
            'verbose': {
                'format': '%(levelname)s %(asctime)s %(module)s '
                        '%(process)d %(thread)d %(message)s'
            },
        },
        'handlers': {
            'sentry': {
                'level': 'ERROR', # To capture more than ERROR, change to WARNING, INFO, etc.
                'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
                #'tags': {'custom-tag': 'x'},
            },
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose'
            }
        },
        'loggers': {
            'root': {
                'level': 'WARNING',
                'handlers': ['sentry'],
            },
            'django.db.backends': {
                'level': 'ERROR',
                'handlers': ['console'],
                'propagate': False,
            },
            'raven': {
                'level': 'DEBUG',
                'handlers': ['console'],
                'propagate': False,
            },
            'sentry.errors': {
                'level': 'DEBUG',
                'handlers': ['console'],
                'propagate': False,
            },
        },
    }
    # Not debug means we should be over https!!
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    # Disable HTML rendering of API
    REST_FRAMEWORK = {
        'DEFAULT_RENDERER_CLASSES': (
            'rest_framework.renderers.JSONRenderer',
        ),
        'DEFAULT_PERMISSION_CLASSES': (
            'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly',
        ),
        'DEFAULT_THROTTLE_CLASSES': (
            'rest_framework.throttling.AnonRateThrottle',
            'rest_framework.throttling.UserRateThrottle'
        ),
        'DEFAULT_THROTTLE_RATES': {
            'anon': '300/hour', # Sufficient
            'user': '10000/day'
        }
    }

    REST_FRAMEWORK_EXTENSIONS = {
        'DEFAULT_CACHE_RESPONSE_TIMEOUT': 60 * 5 # 5 minutes
    }
else:
    REST_FRAMEWORK_EXTENSIONS = {
        'DEFAULT_CACHE_RESPONSE_TIMEOUT': 0 # Dummy API cache for debugging
    }

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

USE_I18N = True
USE_L10N = True
USE_TZ = True
LANGUAGE_COOKIE_NAME = "comicake_language"


#COMPRESS_ROOT = os.path.join(BASE_DIR, 'static/')
#COMPRESS_ENABLED = True

INTERNAL_IPS = '127.0.0.1'
SITE_ID = 1

## DEPRECATED FOR WEBPACK
#COMPRESS_OUTPUT_DIR = 'assets/cache' # Compressed JS/CSS
#COMPRESS_OFFLINE = True

if DEBUG:
    import mimetypes
    # Some scripts get triggered if they they have text/plain django dev server gives them
    mimetypes.add_type("text/javascript", ".js", True)

# Assets integration w/ webpack
WEBPACK_LOADER = {
    'DEFAULT': {
        'CACHE': not DEBUG,
        'BUNDLE_DIR_NAME': 'bundles/', # must end with slash
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json'),
        'POLL_INTERVAL': 0.1,
        'TIMEOUT': None,
        'IGNORE': ['.+\.hot-update.js', '.+\.map']
    }
}