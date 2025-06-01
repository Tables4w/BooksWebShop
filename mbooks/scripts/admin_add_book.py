from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse

def admin_add_book_back(request):
    return render(request, 'mbooks/my_admin/add_book.html')