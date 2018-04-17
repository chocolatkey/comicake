from django.contrib.auth.models import User, Group
from reader.models import Comic, Chapter, Team
from rest_framework import serializers


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')

class TeamSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Team
        fields = ('name', 'slug', 'members', 'description')

class ComicSerializer(serializers.HyperlinkedModelSerializer):
    '''
    chapters = serializers.HyperlinkedRelatedField(
        many=True,
        view_name='api.views.chapters',
        read_only=True,
        #lookup_field='comic_id'
    )
    '''
    class Meta:
        model = Comic
        #, 'author', 'artist', 'tags'
        fields = ('name', 'uniqid', 'slug', 'alt', 'description', 'created_at', 'modified_at', 'cover', 'format')

class ChapterSerializer(serializers.HyperlinkedModelSerializer):
    comic = serializers.ReadOnlyField(source='comic.uniqid')
    class Meta:
        model = Chapter
        fields = ('comic', 'name', 'chapter', 'subchapter', 'protected', 'uniqid', 'volume', 'team', 'language', 'created_at', 'modified_at')