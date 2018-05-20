#from models import ExtendedFlatPage    
from django.contrib.flatpages.forms import FlatpageForm
from .widgets import TrumbowygWidget
from .models import Post, Page
from django import forms

class ExtendedFlatPageForm(FlatpageForm):
    class Meta:
        model = Page
        fields = '__all__'
        widgets = {
            'content': TrumbowygWidget(),
        }

class ImageForm(forms.Form):
    image = forms.ImageField()

class PostAdminForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = '__all__'
        widgets = {
            'content': TrumbowygWidget(),
        }