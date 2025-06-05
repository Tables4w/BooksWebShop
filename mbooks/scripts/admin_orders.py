from enum import IntEnum, auto
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import datetime
from json import dumps
from .specfunc import isAdm
from mbooks.models import Order, OrderStatus, Purchase, Role
import datetime

# Получаем глобальную модель пользователя
User = get_user_model()

# Конвертировать все существующие Purchase с order в единый список
def get_purchases_books(order: Order) -> list:
    out: list = [] # Результирующий список книг

    for ph in Purchase.objects.filter(order=order):
        out.append({
            'name' : ph.book.name,
            'price': ph.book.price
        })

    return out


# Конвертировать все существующие заказы в единый список
def serialize_orders() -> list:
    out: list = [] # Результирующий список заказов

    # Перебор всех заказов в порядке убывания даты их создания
    for order in Order.objects.select_related('status', 'user').order_by('-created_at'):
        out.append({
            'id'       : order.id,
            'status'   : order.status.id,
            'user_name': order.user.username,
            'date'     : order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            'total'    : int(order.price),
            'books'    : get_purchases_books(order) # Список книг в заказе
        })

    return out

# Перечисление всех существующих ролей пользователей
class UserRoles(IntEnum):
    CUSTOMER      = auto(), # Покупатель
    MANAGER       = auto(), # Менеджер
    ADMINISTRATOR = auto(), # Администратор

# Конвертировать всех существующих пользователей с role_id в единый массив
def serialize_users(role_id: UserRoles) -> list:
    out: list = [] # Результирующий список пользователей

    # Перебор всех пользователей с role
    for user in User.objects.filter(role_id=role_id).order_by('-id'):
        out.append({
            'id'      : user.id,
            'login'   : user.username,
            'email'   : user.email
        })

    return out


@csrf_exempt
@require_http_methods(["GET", "POST"])
# Бэкенд страницы заказов для Менеджера/Администратора
def admin_orders_back(request) -> HttpResponse:
    print(f'[admin_orders_back] Received request: {request.method}') # Лог начала функции
    # Проверка на то, авторизован ли пользователь
    if not isAdm(request):
        print('[admin_orders_back] User is not admin. Redirecting.') # Лог не-админа
        return JsonResponse({
            'success': False,
            'error': 'Пользователь не наделен правами доступа к данной странице'
        })

    # Роль пользователя
    role: Role = request.user.role
    print(f'[admin_orders_back] User is {role.name}') # Лог роли пользователя

    # Обработка GET запроса
    if request.method == "GET":
        print('[admin_orders_back] Handling GET request.') # Лог обработки GET

        admins: list   = [] # Список администраторов
        managers: list = [] # Список менеджеров

        if role.id == UserRoles.ADMINISTRATOR:
            print('[admin_orders_back] User is Administrator. Fetching managers and admins.') # Лог админа, получающего списки пользователей
            managers = serialize_users(UserRoles.MANAGER)
            admins = serialize_users(UserRoles.ADMINISTRATOR)
        
        orders_data = serialize_orders() # Получаем данные заказов
        print(f'[admin_orders_back] Fetched {len(orders_data)} orders.') # Лог количества заказов
        # print(f'[admin_orders_back] Orders data sample: {orders_data[:5]}') # Опционально: лог части данных заказов
        
        managers_data = managers
        admins_data = admins
        usertype_data = { 'type': role.name }

        # Выводим страницу с переданным словарём, хранящим два JSON по ключам managers_json и admins_json
        print('[admin_orders_back] Rendering orders.html template.') # Лог перед рендерингом
        return render(request, 'mbooks/my_admin/orders.html', {
            'orders_json'  : dumps(orders_data),   # JSON из списка заказов
            'managers_json': dumps(managers_data),             # JSON из списка менеджеров
            'admins_json'  : dumps(admins_data),               # JSON из списка администраторов
            'usertype_json': dumps(usertype_data) # JSON из словаря типа (имени роли)
        })

    # Обработка POST запросов
    if request.method == "POST":
        print('[admin_orders_back] Handling POST request.') # Лог обработки POST
        # Получение типа POST запроса
        post_type: str = request.POST.get('type')
        print(f'[admin_orders_back] POST type: {post_type}') # Лог типа POST запроса

        # Проверка на корректность типа запроса
        if not post_type: 
            print('[admin_orders_back] Invalid POST type. Returning 400.') # Лог некорректного типа POST
            return JsonResponse({
            'success': False,
            'error': 'Неподдерживаемый тип запроса'
        })

        # Тип запроса - смена статуса заказа
        if post_type == 'changeStatus':
            print('[admin_orders_back] Handling changeStatus request.') # Лог смены статуса
            # Проверка на принадлежность пользователя к Менеджерам или Администраторам
            if role.id not in (UserRoles.MANAGER, UserRoles.ADMINISTRATOR):
                print('[admin_orders_back] User role does not have permission for changeStatus.') # Лог ошибки прав доступа
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            order_id: int = request.POST.get('orderId')  # Айди заказа
            new_status: str = request.POST.get('newStatus')  # Новый статус для заказа
            print(f'[admin_orders_back] changeStatus - orderId: {order_id}, newStatus: {new_status}') # Лог данных смены статуса
            # Проверка на пустоту order_id и new_status_id
            if not order_id or not new_status:
                print('[admin_orders_back] changeStatus - Missing orderId or newStatus. Returning 400.') # Лог отсутствующих данных
                return JsonResponse({
                    'success': False,
                    'error': 'Поля order_id и new_status_id должны быть заполнены'
                })

            # Проверка на существование заказа с order_id
            try:
                order = Order.objects.get(id=order_id)
                print(f'[admin_orders_back] changeStatus - Found order with ID: {order_id}') # Лог найденного заказа
            except Order.DoesNotExist:
                print(f'[admin_orders_back] changeStatus - Order with ID {order_id} not found. Returning 404.') # Лог ненайденного заказа
                return JsonResponse({
                    'success': False,
                    'error': f'Заказ с id={order_id} не найден'
                })

            # Проверка на существование статуса new_status
            if not OrderStatus.objects.filter(name=new_status).exists():
                print(f'[admin_orders_back] changeStatus - Status with name {new_status} not found. Returning 404.') # Лог ненайденного статуса
                return JsonResponse({
                    'success': False,
                    'error': f'Статус с name={new_status} не найден'
                })

            # Пытаемся изменить поле status у заказа. Отлавливаем ошибки, если таковы имеются
            try:
                with transaction.atomic():
                    newStatus=OrderStatus.objects.get(name=new_status)
                    order.status = newStatus
                    order.save()
                    print(f'[admin_orders_back] changeStatus - Successfully updated status for order {order_id} to {new_status}.') # Лог успешного обновления

            except Exception as e:
                print(f'[admin_orders_back] changeStatus - Error updating order status: {e}') # Лог ошибки при обновлении
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка при изменении статуса заказа: {str(e)}'
                })

            # Успешная смена статуса заказа
            print('[admin_orders_back] changeStatus - Status updated successfully. Returning 200.') # Лог успешного ответа
            return JsonResponse({'success': True}, status=200)

            # Тип запроса - добавление нового менеджера
        if post_type == 'addManager':
            print('[admin_orders_back] Handling addManager request.') # Лог добавления менеджера
            # Проверка на принадлежность пользователя к Администраторам
            if role.id != UserRoles.ADMINISTRATOR:
                print('[admin_orders_back] User role does not have permission for addManager.') # Лог ошибки прав доступа
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            login   : str = request.POST.get('login')
            password: str = request.POST.get('password')
            email   : str = request.POST.get('email')
            print(f'[admin_orders_back] addManager - login: {login}, email: {email}') # Лог данных нового менеджера (без пароля)

            # Проверка на то, пустой ли хотя бы 1 элемент формы
            if not login or not password or not email:
                print('[admin_orders_back] addManager - Missing login, password, or email. Returning 400.') # Лог отсутствующих данных
                return JsonResponse({
                    'success': False,
                    'error': 'Поля login, password и email должны быть заполнены'
                })

            # Проверка на то, существует ли уже такой username
            if User.objects.filter(username=login).exists():
                print(f'[admin_orders_back] addManager - User with login {login} already exists. Returning 400.') # Лог существующего пользователя
                return JsonResponse({
                    'success': False,
                    'error': 'Пользователь с таким login уже существует'
                })

            # Электронная почта: для email лучше использовать готовый EmailValidator, но можно так:
            email_validator = RegexValidator(
                regex=r'^[\w\.-]+@[\w\.-]+\.\w{2,}$',
                message='Введите корректный адрес электронной почты.'
            )
            try:
                email_validator(email)
                print('[admin_orders_back] addManager - Email format is valid.') # Лог успешной валидации email
            except ValidationError as e:
                print(f'[admin_orders_back] addManager - Email validation failed: {e.messages}') # Лог ошибки валидации email
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка валидации email: {e.messages[0]}'
                })

            # Пароль: буквы (латиница и кириллица), цифры, подчеркивание. (8-100)
            password_validator = RegexValidator(
                regex=r'^[a-zA-Zа-яА-ЯёЁ0-9_]{8,100}$',
                message='Пароль может содержать буквы, цифры и нижнее подчеркивание. Длина: 8–100 символов.'
            )
            try:
                password_validator(password)
                print('[admin_orders_back] addManager - Password format is valid.') # Лог успешной валидации пароля
            except ValidationError as e:
                print(f'[admin_orders_back] addManager - Password validation failed: {e.messages}') # Лог ошибки валидации пароля
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка валидации пароля: {e.messages[0]}'
                })

            # Создаём нового менеджера
            try:
                with transaction.atomic():
                    user=User.objects.create_user(username=login, password=password, email=email, role_id=UserRoles.MANAGER)
                    print(f'[admin_orders_back] addManager - Successfully created manager: {user.username} (ID: {user.id})') # Лог успешного создания

            except Exception as e:
                print(f'[admin_orders_back] addManager - Error creating manager: {e}') # Лог ошибки при создании
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка при создании менеджера: {str(e)}'
                })

            # Успешное добавление нового менеджера
            print('[admin_orders_back] addManager - Manager added successfully. Returning 201.') # Лог успешного ответа
            return JsonResponse({ 'success': True, 'manager': { 'id': user.id, 'username': user.username, 'email': user.email } }, status=201) # Возвращаем данные созданного менеджера

        # Тип запроса - удаление менеджера
        if post_type == 'removeManager':
            print('[admin_orders_back] Handling removeManager request.') # Лог удаления менеджера

            # Проверка на принадлежность пользователя к Администраторам
            if role.id != UserRoles.ADMINISTRATOR:
                print('[admin_orders_back] User role does not have permission for removeManager.') # Лог ошибки прав доступа
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            # Получение id менеджера для удаления и проверка его на пустоту
            manager_id: int = request.POST.get('manager_id')
            print(f'[admin_orders_back] removeManager - manager_id: {manager_id}') # Лог id менеджера для удаления
            if not manager_id: 
                print('[admin_orders_back] removeManager - Missing manager_id. Returning 400.') # Лог отсутствующих данных
                return JsonResponse({
                'success': False,
                'error': 'Поле manager_id должно быть заполнено'
            })

            # Поиск менеджера по id
            try:
                user: User = User.objects.get(id=manager_id, role_id=UserRoles.MANAGER)
                print(f'[admin_orders_back] removeManager - Found manager with ID: {manager_id}') # Лог найденного менеджера
            except User.DoesNotExist:
                print(f'[admin_orders_back] removeManager - Manager with ID {manager_id} not found. Returning 404.') # Лог ненайденного менеджера
                return JsonResponse({
                'success': False,
                'error': f'Менеджера с id={manager_id} не существует'
            })

            # Пытаемся удалить найденного менеджера. Отлавливаем ошибки, если таковы имеются
            try:
                with transaction.atomic():
                    user.delete()
                    print(f'[admin_orders_back] removeManager - Successfully deleted manager with ID: {manager_id}') # Лог успешного удаления

            except Exception as e: 
                print(f'[admin_orders_back] removeManager - Error deleting manager: {e}') # Лог ошибки при удалении
                return JsonResponse({
                'success': False,
                'error': f'Ошибка при удалении менеджера: {str(e)}'
            })

            # Успешное удаление менеджера
            print('[admin_orders_back] removeManager - Manager deleted successfully. Returning 200.') # Лог успешного ответа
            return JsonResponse({ 'success': True }, status=200)

        print(f'[admin_orders_back] Unknown POST type: {post_type}. Returning 400.') # Лог неизвестного типа POST
        return JsonResponse({
            'success': False,
            'error': 'Неизвестный тип POST запроса'
        })

    # На всякий случай отсекаем все не поддерживающиеся методы
    print(f'[admin_orders_back] Received unsupported method: {request.method}. Returning 405.') # Лог неподдерживаемого метода
    return JsonResponse({
        'success': False,
        'error': 'Allowed methods: GET, POST'
    })

def serialize_users(role_id: int) -> list:
    users = User.objects.filter(role_id=role_id)
    out: list = [] # Результирующий список пользователей

    for user in users:
        out.append({
            'id'       : user.id,
            'username' : user.username,
            'email'    : user.email
        })

    return out