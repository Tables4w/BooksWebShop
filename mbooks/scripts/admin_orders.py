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
    # Проверка на то, авторизован ли пользователь
    if not isAdm(request):
        return JsonResponse({
            'success': False,
            'error': 'Пользователь не наделен правами доступа к данной странице'
        })

    # Роль пользователя
    role: Role = request.user.role

    # Обработка GET запроса
    if request.method == "GET":

        admins: list   = [] # Список администраторов
        managers: list = [] # Список менеджеров

        if role.id == UserRoles.ADMINISTRATOR:
            managers = serialize_users(UserRoles.MANAGER)
            admins = serialize_users(UserRoles.ADMINISTRATOR)
        
        print(serialize_orders());

        # Выводим страницу с переданным словарём, хранящим два JSON по ключам managers_json и admins_json
        return render(request, 'mbooks/my_admin/orders.html', {
            'orders_json'  : dumps(serialize_orders()),   # JSON из списка заказов
            'managers_json': dumps(managers),             # JSON из списка менеджеров
            'admins_json'  : dumps(admins),               # JSON из списка администраторов
            'usertype_json': dumps({ 'type': role.name }) # JSON из словаря типа (имени роли)
        })

    # Обработка POST запросов
    if request.method == "POST":
        # Получение типа POST запроса
        post_type: str = request.POST.get('type')

        # Проверка на корректность типа запроса
        if not post_type: return JsonResponse({
            'success': False,
            'error': 'Неподдерживаемый тип запроса'
        })

        # Тип запроса - смена статуса заказа
        if post_type == 'changeStatus':
            # Проверка на принадлежность пользователя к Менеджерам или Администраторам
            if role.id not in (UserRoles.MANAGER, UserRoles.ADMINISTRATOR):
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            order_id: int = request.POST.get('orderId')  # Айди заказа
            new_status: str = request.POST.get('newStatus')  # Новый статус для заказа
            # Проверка на пустоту order_id и new_status_id
            if not order_id or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'Поля order_id и new_status_id должны быть заполнены'
                })

            # Проверка на существование заказа с order_id
            try: order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': f'Заказ с id={order_id} не найден'
                })

            # Проверка на существование статуса new_status
            if not OrderStatus.objects.filter(name=new_status).exists():
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

            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка при изменении статуса заказа: {str(e)}'
                })

            # Успешная смена статуса заказа
            return JsonResponse({'success': True}, status=200)

            # Тип запроса - добавление нового менеджера
        if post_type == 'addManager':
            # Проверка на принадлежность пользователя к Администраторам
            if role.id != UserRoles.ADMINISTRATOR:
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            login   : str = request.POST.get('login')
            password: str = request.POST.get('password')
            email   : str = request.POST.get('email')

            # Проверка на то, пустой ли хотя бы 1 элемент формы
            if not login or not password or not email:
                return JsonResponse({
                    'success': False,
                    'error': 'Поля login, password и email должны быть заполнены'
                })

            # Проверка на то, существует ли уже такой username
            if User.objects.filter(username=login).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Пользователь с таким login уже существует'
                })

            # Логин: буквы (латиница и кириллица), цифры, подчеркивание, дефис. (1-80)
            login_validator = RegexValidator(
                regex=r'^[a-zA-Zа-яА-ЯёЁ0-9_-]{1,80}$',
                message='Логин может содержать буквы, цифры, дефис и нижнее подчеркивание. Длина: 1–80 символов.'
            )

            # Пароль: буквы (латиница и кириллица), цифры, подчеркивание. (8-100)
            password_validator = RegexValidator(
                regex=r'^[a-zA-Zа-яА-ЯёЁ0-9_]{8,100}$',
                message='Пароль может содержать буквы, цифры и нижнее подчеркивание. Длина: 8–100 символов.'
            )

            # Электронная почта: для email лучше использовать готовый EmailValidator, но можно так:
            email_validator = RegexValidator(
                 regex=r'^[\w\.-]+@[\w\.-]+\.\w{2,}$',
                 message='Введите корректный адрес электронной почты.'
            )

            # Проверяем корректность логина
            try: login_validator(login)
            except ValidationError as e:
                return JsonResponse({
                    'success': False,
                    'error': e.message
                })

            # Проверяем корректность пароля
            try: password_validator(password)
            except ValidationError as e:
                return JsonResponse({
                    'success': False,
                    'error': e.message
                })

            # Проверяем корректность почты
            try: email_validator(email)
            except ValidationError as e:
                return JsonResponse({
                    'success': False,
                    'error': e.message
                })

            first_name: str = 'Червяк'   # Затычка имени
            last_name : str = 'Червяков' # Затычка фамилии
            dob: datetime = datetime.date(2005, 10, 19) # Затычка дня рождения (мой, кста)

            # Пытаемся добавить нового менеджера. Отлавливаем ошибки, если таковы имеются
            try:
                with transaction.atomic():
                    User.objects.create_user(
                        username=login,
                        password=password,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        dob=dob,
                        role_id=2
                    )

            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Ошибка при добавлении нового менеджера: {str(e)}'
                })

            # Успешное добавление нового менеджера
            return JsonResponse({'success': True}, status=200)

        # Тип запроса - удаление менеджера
        if post_type == 'removeManager':

            # Проверка на принадлежность пользователя к Администраторам
            if role.id != UserRoles.ADMINISTRATOR:
                return JsonResponse({
                    'success': False,
                    'error': 'Роль пользователя не имеет прав на выполнение этого запроса'
                })

            # Получение id менеджера для удаления и проверка его на пустоту
            manager_id: int = request.POST.get('manager_id')
            if not manager_id: return JsonResponse({
                'success': False,
                'error': 'Поле manager_id должно быть заполнено'
            })

            # Поиск менеджера по id
            try: user: User = User.objects.get(id=manager_id, role_id=UserRoles.MANAGER)
            except User.DoesNotExist: return JsonResponse({
                'success': False,
                'error': f'Менеджера с id={manager_id} не существует'
            })

            # Пытаемся удалить найденного менеджера. Отлавливаем ошибки, если таковы имеются
            try:
                with transaction.atomic(): user.delete()
            except Exception as e: return JsonResponse({
                'success': False,
                'error': f'Ошибка при удалении менеджера: {str(e)}'
            })

            # Успешное удаление менеджера
            return JsonResponse({ 'success': True }, status=200)

        return JsonResponse({
            'success': False,
            'error': 'Неизвестный тип POST запроса'
        })

    # На всякий случай отсекаем все не поддерживающиеся методы
    return JsonResponse({
        'success': False,
        'error': 'Allowed methods: GET, POST'
    })