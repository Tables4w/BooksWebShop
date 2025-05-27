from django.shortcuts import render

def basket_back(request):
    """
    Handle the basket page view
    """
    return render(request, 'mbooks/basket.html') 