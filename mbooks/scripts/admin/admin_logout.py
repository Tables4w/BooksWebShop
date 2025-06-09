from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse
from ..specfunc import isAdm


def admin_logout_back(request):
    if request.method=='POST':
        if not isAdm(request):
                return redirect('/my_admin/orders/')
        logout(request)
        return redirect('/auth/')
    else:
        return JsonResponse({'error':'only POST allowed'}, status=405)