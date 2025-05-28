<<<<<<< HEAD
from django.shortcuts import render
from .scripts.mainpage import *
from .scripts.auth import *
from .scripts.profile import *
from .scripts.catalog import *
from .scripts.book import *
from .scripts.basket import *
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
@csrf_exempt
def mainpage_view(request):
    return mainpage_back(request)

@csrf_exempt
def auth_view(request):
    return auth_back(request)

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
=======
from django.shortcuts import render
from .scripts.mainpage import *
from .scripts.auth import *
from .scripts.profile import *
from .scripts.catalog import *
from .scripts.book import *
from .scripts.basket import *
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
@csrf_exempt
def mainpage_view(request):
    return mainpage_back(request)

@csrf_exempt
def auth_view(request):
    return auth_back(request)

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
>>>>>>> bfc5a31cb716480983574697383b974e5bd97527
    return basket_back(request)