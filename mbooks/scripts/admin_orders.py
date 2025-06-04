from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse

def admin_orders_back(request):
    # Список ожидаемых данных при get-запросе в render:

    # orders_json – заказы
    # managers_json – менеджеры
    # admins_json – админы
    # usertype_json – тип пользователя (словарь вида {'type':'administrator'} или {'type':'manager'})


    return render(request, 'mbooks/my_admin/orders.html')