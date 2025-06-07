from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from mbooks.models import *
from django.core.exceptions import ValidationError
from mbooks.scripts.auth import FormTypeInvalid
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.http import JsonResponse
from django.contrib.auth import update_session_auth_hash, logout
from django.core.validators import validate_email, RegexValidator
from django.db import transaction
from mbooks.models import User, Gender

User=get_user_model()

#Валидация данных карты и суммы пополнения
def deposit_info_validate(errors, card_num, date, cvv, summ):
    card_num_validate = RegexValidator(
        regex=r'^[0-9]{4}\s[0-9]{4}\s[0-9]{4}\s[0-9]{4}$',
        message='Номер карты может содержать только цифры, длина номера карты 16 символов'
    )
    
    date_validate = RegexValidator(
        regex=r'^\d{2}/\d{2}$',
        message='Введите дату в формате MM-YY.'
    )
    
    cvv_validate = RegexValidator(
        regex=r'^[0-9]{3}$',
        message='CVV может содержать только 3 цифры'
    )
    
    summ_validate = RegexValidator(
        regex=r'^(?!0\d)\d{1,12}(?:\.\d{1,2})?$',
        message='Некорректная сумма'
    )

    try:
        card_num_validate(card_num)
    except ValidationError as e:
        errors['card_num']=e.messages

    try:
        date_validate(date)
    except ValidationError as e:
        errors['date']=e.messages

    try: 
        cvv_validate(cvv)
    except ValidationError as e:
        errors['cvv']=e.messages

    try:
        summ_validate(summ)
    except ValidationError as e:
        errors['summ']=e.messages

def validate_profile_data(errors, fname, lname, gender, dob):
    fname_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-ЯёЁ-]{1,}$',
        message='Имя может содержать только буквы и дефис.'
    )
    lname_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-ЯёЁ-]{1,}$',
        message='Фамилия может содержать только буквы и дефис.'
    )
    gender_validator = RegexValidator(
        regex=r'^[мжМЖ]$',
        message='Выберите мужской или женский пол'
    )
    date_validator = RegexValidator(
        regex=r'^\d{4}-\d{2}-\d{2}$',
        message='Дата в формате ГГГГ-ММ-ДД'
    )

    validators = {
        'fname': (fname_validator, fname),
        'lname': (lname_validator, lname),
        'gender': (gender_validator, gender),
        'dob': (date_validator, dob)
    }
    
    for field, (validator, value) in validators.items():
        try:
            validator(value)
        except ValidationError as e:
            errors[field] = e.messages

def validate_pass(errors, paswd):
    password_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-ЯёЁ0-9_]{8,100}$',
        message='Пароль может содержать буквы, цифры и нижнее подчеркивание. Длина: 8–100 символов.'
    )

    try:
        password_validator(paswd)
    except ValidationError as e:
        errors['password'] = e.messages

def profile_back(request):
    if request.method == 'POST':
        errors = {}
        try:
            action_type = request.POST.get('type')
            user = request.user

            #Если тип формы депозит выполняется пополнение    
            if action_type=='deposit':

                card_num=request.POST.get('cardNum')
                date=request.POST.get('date')
                cvv=request.POST.get('cvv')
                summ=request.POST.get('summ')

                errors={}

                deposit_info_validate(errors,card_num,date,cvv,summ)
                if errors!={}:
                    raise ValidationError("Validation error")
                
                request.user.balance += Decimal(summ)
                request.user.save()

                return JsonResponse({'success': 'Баланс пополнен успешно!'})

            if action_type == 'update_profile':
                # Валидация основных данных
                data = {
                    'fname': request.POST.get('fname'),
                    'lname': request.POST.get('lname'),
                    'gender': request.POST.get('gender'),
                    'dob': request.POST.get('dob')
                }
                
                validate_profile_data(errors, **data)
                if errors:
                    raise ValidationError("Validation error")

                # Обновление полей
                user.first_name = data['fname']
                user.last_name = data['lname']
                user.gender = data['gender'].lower()
                user.dob = data['dob']
                user.save()
                return JsonResponse({'success': True})

            elif action_type == 'change_password':
                # Валидация пароля
                current = request.POST.get('current_password')
                new_pass = request.POST.get('new_password')
                confirm = request.POST.get('confirm_password')

                if not user.check_password(current):
                    errors['current_password'] = ['Текущий пароль неверен']
                if new_pass != confirm:
                    errors['confirm_password'] = ['Пароли не совпадают']
                validate_pass(errors, new_pass);
                if errors:
                    raise ValidationError("Validation error")

                user.set_password(new_pass)
                user.save()
                update_session_auth_hash(request, user)
                return JsonResponse({'success': True})

            elif action_type == 'change_email':
                # Валидация email
                new_email = request.POST.get('new_email').lower()
                try:
                    validate_email(new_email)
                    if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                        raise ValidationError('Email уже занят')
                except ValidationError as e:
                    errors['email'] = [str(e)]
                    raise

                user.email = new_email
                user.save()
                return JsonResponse({'success': True})

            elif action_type == 'delete_account':
                user.delete()
                logout(request);
                return JsonResponse({'success': 'Аккаунт удалён'})
            
            elif action_type == 'logout':
                logout(request)
                return JsonResponse({'success': 'Успешный выход'})

            else:
                return JsonResponse({'errors': 'Неизвестное действие'}, status=400)

        except ValidationError:
            return JsonResponse({'errors': errors}, status=400)
        except Exception as e:
            return JsonResponse({'errors': str(e)}, status=500)

    # GET запрос
    if request.method=='GET':
        return render(request, 'mbooks/profile.html', {
            'user': request.user,
            'gender_choices': Gender.choices
        })
    
    else:
        return JsonResponse({'Errors': 'Allowed methods: GET, POST'}, status=405) ;