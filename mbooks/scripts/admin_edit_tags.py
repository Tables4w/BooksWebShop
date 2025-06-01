from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse

def admin_edit_tags_back(request):
    return render(request, 'mbooks/my_admin/edit_tags.html')