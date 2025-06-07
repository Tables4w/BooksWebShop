from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect
from django.http import JsonResponse
from mbooks.models import *
import json
import base64
from .specfunc import detect_image_type

User=get_user_model()

def getuserorders_back(request):
    print(f'[getuserorders_back] Received request: {request.method}') # Лог начала функции
    if(request.method=='GET'):
        user = request.user
        print(f'[getuserorders_back] Fetching orders for user: {user.username} (ID: {user.id})') # Лог пользователя
        
        # Проверяем все заказы в базе
        all_orders = Order.objects.all()
        print(f'[getuserorders_back] Total orders in database: {all_orders.count()}') # Лог общего количества заказов
        
        # Получаем заказы пользователя
        orders = Order.objects.filter(user=user).order_by('-created_at')
        print(f'[getuserorders_back] Found {orders.count()} orders for user {user.username}') # Лог количества найденных заказов
        
        # Выводим детали каждого заказа
        for order in orders:
            print(f'[getuserorders_back] Order ID: {order.id}, Status: {order.status.name}, Created: {order.created_at}, Price: {order.price}') # Лог деталей заказа

        result = []
        for order in orders:
            print(f'[getuserorders_back] Processing order ID: {order.id}') # Лог обработки каждого заказа
            purchases = Purchase.objects.filter(order=order)
            print(f'[getuserorders_back] Found {purchases.count()} purchases for order {order.id}') # Лог количества покупок в заказе
            items = []
            for purchase in purchases:
                print(f'[getuserorders_back] Processing purchase ID: {purchase.id} for book: {purchase.book.name}') # Лог обработки покупки
                cover_image = ''
                if purchase.book.cover:
                    img_type = detect_image_type(purchase.book.cover)
                    if img_type:
                        try:
                            cover_image = f'data:image/{img_type};base64,{base64.b64encode(purchase.book.cover).decode("utf-8")}'
                        except Exception as e:
                            print(f'[getuserorders_back] Error encoding cover image for book {purchase.book.name}: {e}') # Лог ошибки кодирования
                            cover_image = ''

                items.append({
                    'id': purchase.book.id,
                    'title': purchase.book.name,
                    'price': purchase.book.price,
                    'quantity': purchase.count,
                    'image': cover_image if cover_image else ''
                })
            result.append({
                'id': order.id,
                'date': order.created_at.isoformat(),
                'status': order.status.name,
                'items': items
            })

        print(f'[getuserorders_back] Sending JSON response with {len(result)} orders') # Лог перед отправкой ответа
        return JsonResponse(result, safe=False)
    
    else:
        print(f'[getuserorders_back] Received non-GET request: {request.method}. Returning 405.') # Лог для не-GET запросов
        return JsonResponse({'error: only GET allowed'}, status=405)