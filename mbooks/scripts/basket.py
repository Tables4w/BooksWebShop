from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.db import transaction
from mbooks.models import *
import json;

def basket_back(request):

    if request.method == 'GET':
        return render(request, 'mbooks/basket.html')

    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Требуется авторизация'}, status=401)

        try:
            data = json.loads(request.body)
            items = data.get('items', [])

            if not items:
                return JsonResponse({'error': 'Корзина пуста'}, status=400)

            user = request.user

            total_price = 0
            for item in items:
                book = Book.objects.get(id=item['id'])
                quantity = int(item.get('quantity', 1))
                total_price += book.price * quantity
                

            if user.balance < total_price:
                return JsonResponse({'error': 'Недостаточно средств на балансе'}, status=402)

            status_name = 'Оформлен'
            try:
                status = OrderStatus.objects.get(name=status_name)
            except OrderStatus.DoesNotExist:
                status = OrderStatus.objects.create(name=status_name)

            try:
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
                return JsonResponse({'success': True, 'order_id': order.id})

            except Exception as e:
                # Повторно поднимаем исключение, чтобы Django мог обработать его как ошибку сервера
                raise e

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Неверный формат данных'}, status=400)
        except Book.DoesNotExist as e:
            return JsonResponse({'error': 'Книга не найдена'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
