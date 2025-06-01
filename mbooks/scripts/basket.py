from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.db import transaction
from mbooks.models import *
import json;

def basket_back(request):
    if(request.method=='GET'):
        return render(request, 'mbooks/basket.html') 
    elif(request.method=='POST'):
        try:
            data = json.loads(request.body)

            user=request.user;
            if not user.is_authenticated:
                return JsonResponse({'error': 'Требуется авторизация'}, status=403)
            
            items = data.get('items', [])
            if not items:
                return HttpResponseBadRequest('Список товаров пуст')
            
            total_price = 0
            for item in items:
                total_price += int(item['price']) * int(item.get('quantity', 1))

            if user.balance < total_price:
                return JsonResponse({'error': 'Недостаточно средств на балансе'}, status=402)

            status_name = data.get('status', 'Оформлен')
            status = OrderStatus.objects.get(name=status_name)

            with transaction.atomic():
                # Списываем с баланса
                user.balance -= total_price
                user.save()

                # Создаём заказ
                order = Order.objects.create(
                    user=user,
                    status=status,
                    price=total_price
                )

                # Создаём покупки и увеличиваем sold
                for item in items:
                    book = Book.objects.get(id=item['id'])
                    quantity = int(item.get('quantity', 1))

                    Purchase.objects.create(
                        order=order,
                        book=book,
                        count=quantity
                    )

                    book.sold += quantity
                    book.save()

            return JsonResponse({'message': 'Заказ успешно создан', 'order_id': order.id}, status=201)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
