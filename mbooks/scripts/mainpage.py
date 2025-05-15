from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.shortcuts import render
from mbooks.models import *
import base64

User=get_user_model();

def mainpage_back(request):
    if request.method=='GET':
        return render(request, 'mbooks/index.html')