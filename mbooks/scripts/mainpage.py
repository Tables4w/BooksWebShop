from django.shortcuts import render
from mbooks.models import *
import base64

def mainpage_back(request):
    if request.method=='GET':
        return render(request, 'mbooks/index.html')