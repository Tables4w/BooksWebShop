from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.db import transaction
from mbooks.models import *
import json;

def basket_back(request):
    print(f'[basket_back] Received request: {request.method}') # Лог начала функции

    if request.method == 'GET':
        print('[basket_back] Handling GET request.') # Лог обработки GET
        return render(request, 'mbooks/basket.html')

    if request.method == 'POST':
        print('[basket_back] Handling POST request.') # Лог обработки POST
        if not request.user.is_authenticated:
            print('[basket_back] User not authenticated. Returning 401.') # Лог неаутентифицированного пользователя
            return JsonResponse({'error': 'Требуется авторизация'}, status=401)

        try:
            data = json.loads(request.body)
            print(f'[basket_back] Received data: {data}') # Лог полученных данных
            items = data.get('items', [])
            print(f'[basket_back] Items from request: {items}') # Лог товаров из запроса

            if not items:
                print('[basket_back] No items in request. Returning 400.') # Лог отсутствия товаров
                return JsonResponse({'error': 'Корзина пуста'}, status=400)

            user = request.user
            print(f'[basket_back] Processing order for user: {user.username} (ID: {user.id})') # Лог пользователя

            total_price = 0
            for item in items:
                book = Book.objects.get(id=item['id'])
                quantity = int(item.get('quantity', 1))
                total_price += book.price * quantity
                print(f'[basket_back] Book {book.name}: {book.price} * {quantity} = {book.price * quantity}') # Лог расчета цены для каждой книги

            print(f'[basket_back] Calculated total price: {total_price}') # Лог итоговой суммы

            print(f'[basket_back] User balance: {user.balance}, Total price: {total_price}') # Лог баланса и суммы
            if user.balance < total_price:
                print('[basket_back] Insufficient balance. Returning 402.') # Лог недостатка средств
                return JsonResponse({'error': 'Недостаточно средств на балансе'}, status=402)

            status_name = 'Оформлен'
            print(f'[basket_back] Using default status: {status_name}') # Лог используемого статуса
            try:
                status = OrderStatus.objects.get(name=status_name)
                print(f'[basket_back] Found OrderStatus object: {status.name} (ID: {status.id})') # Лог найденного статуса
            except OrderStatus.DoesNotExist:
                print(f'[basket_back] OrderStatus "{status_name}" not found. Creating it.') # Лог отсутствия статуса
                status = OrderStatus.objects.create(name=status_name)
                print(f'[basket_back] Created new OrderStatus: {status.name} (ID: {status.id})') # Лог создания статуса

            print('[basket_back] Starting atomic transaction block.') # Лог перед транзакцией
            try:
                with transaction.atomic():
                    print('[basket_back] Inside atomic transaction.') # Лог внутри транзакции
                    # Списываем с баланса
                    user.balance -= total_price
                    user.save()
                    print(f'[basket_back] User balance updated. New balance: {user.balance}') # Лог обновления баланса

                    # Создаём заказ
                    print('[basket_back] Creating Order object.') # Лог перед созданием заказа
                    order = Order.objects.create(
                        user=user,
                        status=status,
                        price=total_price
                    )
                    print(f'[basket_back] Created Order object: {order.id} for user {order.user.username}') # Лог созданного заказа

                    # Создаём покупки и увеличиваем sold
                    print('[basket_back] Creating Purchase objects.') # Лог перед созданием покупок
                    for item in items:
                        book = Book.objects.get(id=item['id'])
                        quantity = int(item.get('quantity', 1))
                        print(f'[basket_back] Creating Purchase for book ID: {book.id}, Quantity: {quantity}') # Лог данных покупки

                        Purchase.objects.create(
                            order=order,
                            book=book,
                            count=quantity
                        )
                        print(f'[basket_back] Created Purchase object for book: {book.name}') # Лог созданной покупки

                        book.sold += quantity
                        book.save()
                        print(f'[basket_back] Updated sold count for book {book.name}. New sold: {book.sold}') # Лог обновления sold

                print('[basket_back] Atomic transaction block finished without exception.') # Лог после успешной транзакции
                print('[basket_back] Transaction completed successfully. Returning success response.') # Лог перед возвратом успеха
                return JsonResponse({'success': True, 'order_id': order.id})

            except Exception as e:
                print(f'[basket_back] Exception inside or after atomic transaction: {e}') # Лог исключения внутри транзакции
                # Повторно поднимаем исключение, чтобы Django мог обработать его как ошибку сервера
                raise e # Убрал return JsonResponse, чтобы Django обработал ошибку

        except json.JSONDecodeError:
            print('[basket_back] Invalid JSON in request body.') # Лог ошибки JSON
            return JsonResponse({'error': 'Неверный формат данных'}, status=400)
        except Book.DoesNotExist as e:
            print(f'[basket_back] Book not found: {e}') # Лог отсутствия книги
            return JsonResponse({'error': 'Книга не найдена'}, status=404)
        except Exception as e:
            print(f'[basket_back] Unexpected error outside atomic block: {e}') # Лог неожиданной ошибки
            return JsonResponse({'error': str(e)}, status=500)
