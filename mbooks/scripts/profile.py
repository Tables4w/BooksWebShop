from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from django.core.exceptions import ValidationError
from django.contrib.auth import update_session_auth_hash
from django.core.validators import validate_email, RegexValidator
from django.shortcuts import render
from django.db import transaction
from decimal import Decimal
from mbooks.models import User, Gender

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



def profile_back(request):
    if request.method == 'POST':
        errors = {}
        try:
            action_type = request.POST.get('type')
            user = request.user

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
                if errors:
                    raise ValidationError

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

            elif action_type == 'deposit':
                # Пополнение баланса
                try:
                    amount = Decimal(request.POST.get('summ'))
                    if amount <= 0:
                        raise ValueError
                except:
                    errors['summ'] = ['Некорректная сумма']
                    raise ValidationError

                user.balance += amount
                user.save()
                return JsonResponse({
                    'success': True,
                    'new_balance': str(user.balance)
                })

            elif action_type == 'delete_account':
                user.delete()
                return JsonResponse({'redirect': '/auth/'})

            else:
                return JsonResponse({'error': 'Неизвестное действие'}, status=400)

        except ValidationError:
            return JsonResponse({'errors': errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    # GET запрос
    return render(request, 'mbooks/profile.html', {
        'user': request.user,
        'gender_choices': Gender.choices
    })