from dynamic_preferences.types import BooleanPreference, StringPreference
from dynamic_preferences.preferences import Section
from dynamic_preferences.registries import global_preferences_registry
from dynamic_preferences.users.registries import user_preferences_registry

# we create some section objects to link related preferences together

site = Section('site')
reader = Section('reader')
discussion = Section('discussion')

# We start with a global preference
@global_preferences_registry.register
class SiteName(StringPreference):
    section = site
    name = 'name'
    default = 'ComiCake'

@global_preferences_registry.register
class MaintenanceMode(BooleanPreference):
    section = site
    name = 'maintenance'
    default = False

@global_preferences_registry.register
class ProtectedByDefault(BooleanPreference):
    section = reader
    name = 'protected_by_default'
    default = False

# now we declare a per-user preference
@user_preferences_registry.register
class CommentNotificationsEnabled(BooleanPreference):
    """Do you want to be notified on comment publication ?"""
    section = discussion
    name = 'comment_notifications_enabled'
    default = True