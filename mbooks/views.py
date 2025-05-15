from django.shortcuts import render
from .scripts.mainpage import *

# Create your views here.
def mainpage_view(request):
    return mainpage_back(request)