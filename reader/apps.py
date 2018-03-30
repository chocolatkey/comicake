from django.apps import AppConfig
from django.conf import settings

from dynamic_preferences.registries import preference_models
from .registries import site_preferences_registry


class ReaderConfig(AppConfig):
    name = 'reader'
    def ready(self):
        SitePreferenceModel = self.get_model('SitePreferenceModel')

        preference_models.register(SitePreferenceModel, site_preferences_registry)
