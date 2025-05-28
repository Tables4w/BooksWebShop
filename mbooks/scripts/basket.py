from django.shortcuts import render

def basket_back(request):
    return render(request, 'mbooks/basket.html') 