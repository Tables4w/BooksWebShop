from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect
from django.http import JsonResponse
from mbooks.models import *
import json
import base64
from .specfunc import detect_image_type

User=get_user_model()

def getuserorders_back(request):
    if(request.method=='GET'):
        user = request.user
        orders = Order.objects.filter(user=user).order_by('-created_at')

        result = []
        for order in orders:
            purchases = Purchase.objects.filter(order=order)
            items = []
            for purchase in purchases:
                cover_image = ''
                if purchase.book.cover:
                    img_type = detect_image_type(purchase.book.cover)
                    if img_type:
                        cover_image = f'data:image/{img_type};base64,{base64.b64encode(purchase.book.cover).decode("utf-8")}'

                items.append({
                    'id': purchase.book.id,
                    'title': purchase.book.name,
                    'price': purchase.book.price,
                    'quantity': purchase.count,
                    'image': cover_image if cover_image else '' # Или URL для API изображения
                })
            result.append({
                'id': order.id,
                'date': order.created_at.isoformat(),
                'status': order.status.name,
                'items': items
            })

        return JsonResponse(result, safe=False)
    
    else:
        return JsonResponse({'error: only GET allowed'}, status=405)