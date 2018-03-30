from django.contrib.auth.models import User, Group
from reader.models import Comic
from rest_framework import serializers


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')

class ComicSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Comic
        #, 'author', 'artist', 'tags'
        fields = ('name', 'uniqid', 'slug', 'alt', 'description', 'created_at', 'modified_at', 'cover', 'format')