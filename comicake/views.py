from django.shortcuts import render
from django.conf import settings
from django.utils.translation import gettext as _

# Homepage
def home(request):
    return render(request, 'home.html')
