from django.shortcuts import render
from .scripts.mainpage import *
from .scripts.auth import *
from .scripts.profile import *
from .scripts.catalog import *
from .scripts.book import *
from .scripts.basket import *
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

# Create your views here.
@csrf_exempt
def mainpage_view(request):
    return mainpage_back(request)

@csrf_exempt
def auth_view(request):
    return auth_back(request)

login_required(login_url='/auth/')
@csrf_exempt
def profile_view(request):
    return profile_back(request)

@csrf_exempt
def catalog_view(request):
    return catalog_back(request)

@csrf_exempt
def book_view(request, id):
    return book_back(request, id)

@csrf_exempt
def basket_view(request):
    return basket_back(request)