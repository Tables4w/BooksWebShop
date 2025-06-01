from django.shortcuts import render, redirect
from .scripts.mainpage import *
from .scripts.auth import *
from .scripts.profile import *
from .scripts.catalog import *
from .scripts.book import *
from .scripts.basket import *
from .scripts.getuserorders import *
from .scripts.admin_logout import *
from .scripts.admin_orders import *
from .scripts.admin_catalog import *
from .scripts.admin_add_book import *
from .scripts.admin_book import *
from .scripts.admin_edit_tags import *
from .scripts.specfunc import isAdm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

# Create your views here.
@csrf_exempt
def mainpage_view(request):
    if isAdm(request):
        return redirect('/my_admin/orders/')
    return mainpage_back(request)

@csrf_exempt
def auth_view(request):
    return auth_back(request)

login_required(login_url='/auth/')
@csrf_exempt
def profile_view(request):
    if isAdm(request):
        return redirect('/my_admin/orders/')
    return profile_back(request)

@csrf_exempt
def catalog_view(request):
    if isAdm(request):
        return redirect('/my_admin/catalog/')
    return catalog_back(request)

@csrf_exempt
def book_view(request, id):
    if isAdm(request):
        return redirect('/my_admin/book/')
    return book_back(request, id)

@csrf_exempt
def basket_view(request):
    if isAdm(request):
        return redirect('/my_admin/orders/')
    return basket_back(request)

login_required(login_url='/auth/')
@csrf_exempt
def getuserorders_view(request):
    if not isAdm(request):
        return redirect('/main/')
    return getuserorders_back(request)

@csrf_exempt
def admin_catalog_view(request):
    if not isAdm(request):
        return redirect('/catalog/')
    return admin_catalog_back(request)

@csrf_exempt
def admin_book_view(request, id):
    if not isAdm(request):
        return redirect('/main/')
    return admin_book_back(request, id)

@csrf_exempt
def admin_add_book_view(request):
    if not isAdm(request):
        return redirect('/main/')
    return admin_add_book_back(request)

@csrf_exempt
def admin_edit_tags_view(request):
    if not isAdm(request):
        return redirect('/main/')
    return admin_edit_tags_back(request)

@csrf_exempt
def admin_orders_view(request):
    if not isAdm(request):
        return redirect('/main/')
    return admin_orders_back(request)

@csrf_exempt
def admin_logout_view(request):
    return admin_logout_back(request)