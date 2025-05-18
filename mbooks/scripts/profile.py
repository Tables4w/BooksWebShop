from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required(login_url='/auth/')
def profile_back(request):
    if request.method=='GET':
        return render(request, 'mbooks/profile.html')