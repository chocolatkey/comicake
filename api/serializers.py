from django.contrib.auth.models import User, Group
from reader.models import Comic, Chapter, Team, Tag, Person, Licensee
from rest_framework import serializers

# Caching
from rest_framework_cache.serializers import CachedSerializerMixin
from rest_framework_cache.registry import cache_registry

class UserSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    @staticmethod
    def setup_eager_loading(queryset):
        """
        Perform necessary eager loading of data.
        Thanks to Scott Stafford @ http://ses4j.github.io/2015/11/23/optimizing-slow-django-rest-framework-performance/
        """
        # prefetch_related for "to-many" relationships
        queryset = queryset.prefetch_related('groups')
        return queryset

    class Meta:
        model = User
        fields = ('url', 'username', 'groups')

class PersonSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    class Meta:
        model = Person
        fields = ('name', 'alt')

class LicenseeSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    class Meta:
        model = Licensee
        fields = ('name', 'homepage', 'logo')

class GroupSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    class Meta:
        model = Group
        fields = ('url', 'name')

# I don't like this
class MiniTagSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    class Meta:
        model = Tag
        fields = ('name', 'slug')

class TagSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    class Meta:
        model = Tag
        fields = ('name', 'slug', 'description')

class TeamSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    @staticmethod
    def setup_eager_loading(queryset):
        """
        Perform necessary eager loading of data.
        Thanks to Scott Stafford @ http://ses4j.github.io/2015/11/23/optimizing-slow-django-rest-framework-performance/
        """
        # prefetch_related for "to-many" relationships
        queryset = queryset.prefetch_related('members')
        return queryset

    class Meta:
        model = Team
        fields = ('name', 'members', 'description')

class ComicSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    '''
    chapters = serializers.HyperlinkedRelatedField(
        many=True,
        view_name='api.views.chapters',
        read_only=True,
        #lookup_field='comic_id'
    )
    '''
    tags = MiniTagSerializer(read_only=True, many=True)
    author = PersonSerializer(read_only=True, many=True)
    artist = PersonSerializer(read_only=True, many=True)

    @staticmethod
    def setup_eager_loading(queryset):
        """
        Perform necessary eager loading of data.
        Thanks to Scott Stafford @ http://ses4j.github.io/2015/11/23/optimizing-slow-django-rest-framework-performance/
        """
        # prefetch_related for "to-many" relationships
        queryset = queryset.prefetch_related('author', 'artist', 'tags', 'licenses')
        return queryset

    class Meta:
        model = Comic
        #, 'author', 'artist', 'tags'
        fields = ('id', 'name', 'uniqid', 'slug', 'alt', 'author', 'artist', 'adult', 'tags', 'description', 'created_at', 'modified_at', 'cover', 'licenses', 'format')

class ChapterSerializer(serializers.HyperlinkedModelSerializer, CachedSerializerMixin):
    #comic = serializers.ReadOnlyField(source='comic.uniqid')
    comic = serializers.ReadOnlyField(source='comic.id')
    protection = serializers.ReadOnlyField(source='get_protection')

    @staticmethod
    def setup_eager_loading(queryset):
        """
        Perform necessary eager loading of data.
        Thanks to Scott Stafford @ http://ses4j.github.io/2015/11/23/optimizing-slow-django-rest-framework-performance/
        """
        # prefetch_related for "to-many" relationships
        queryset = queryset.prefetch_related('team')
        # select_related for "to-one" relationships
        queryset = queryset.select_related('comic', 'protection')
        return queryset

    class Meta:
        model = Chapter
        fields = ('id', 'comic', 'name', 'chapter', 'subchapter', 'protection', 'uniqid', 'volume', 'team', 'language', 'created_at', 'modified_at')

cache_registry.register(UserSerializer)
cache_registry.register(PersonSerializer)
cache_registry.register(LicenseeSerializer)
cache_registry.register(GroupSerializer)
cache_registry.register(MiniTagSerializer)
cache_registry.register(TagSerializer)
cache_registry.register(TeamSerializer)
cache_registry.register(ComicSerializer)
cache_registry.register(ChapterSerializer)