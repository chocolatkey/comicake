from django.conf import settings
UPLOAD_PATH = getattr(settings, 'TRUMBOWYG_UPLOAD_PATH', 'uploads/')