from django.contrib.auth.models import User, Group
from reader.models import Comic, Chapter, Team, Tag, Person, Licensee
from rest_framework import serializers
from django.urls import reverse
#from serpy import Serializer

class UserSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
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
        fields = ('id', 'username', 'groups')

class PersonSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    class Meta:
        model = Person
        fields = ('id', 'name', 'alt')

class LicenseeSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    class Meta:
        model = Licensee
        fields = ('id', 'name', 'homepage', 'logo')

class GroupSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    class Meta:
        model = Group
        fields = ('id', 'name')

# I don't like this
class MiniTagSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')

class TagSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug', 'description')

class TeamSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
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
        fields = ('id', 'name', 'members', 'description')

class ComicSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
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

class ChapterSerializer(serializers.ModelSerializer): #, CachedSerializerMixin
    #comic = serializers.ReadOnlyField(source='comic.uniqid')
    comic = serializers.ReadOnlyField(source='comic.id')
    protection = serializers.ReadOnlyField(source='get_protection')
    manifest = serializers.ReadOnlyField()

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
        fields = ('id', 'manifest', 'comic', 'name', 'chapter', 'subchapter', 'protection', 'uniqid', 'volume', 'team', 'language', 'created_at', 'modified_at')