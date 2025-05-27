from django.contrib.auth import authenticate, login
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect
from django.core.validators import RegexValidator
from django.http import JsonResponse
from mbooks.models import *
from django.views.decorators.csrf import csrf_exempt
User=get_user_model();

#Класс исключений, возникающих при обработке формы
class FormTypeInvalid(Exception):
    pass;

#Валидатор формы регистрации
def validatereg(errors, log, paswd, gender, email, dob, fname, lname):
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

    # Дата рождения: стандартный HTML5 формат (YYYY-MM-DD)
    date_validator = RegexValidator(
        regex=r'^\d{4}-\d{2}-\d{2}$',
        message='Введите дату в формате ГГГГ-ММ-ДД.'
    )

    # Пол: только "м" или "ж", без учета регистра
    gender_validator = RegexValidator(
        regex=r'^[мМжЖ]$',
        message='Введите "м" или "ж".'
    )

    # Имя: только буквы и дефис (латиница и кириллица)
    fname_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-ЯёЁ-]{1,}$',
        message='Имя может содержать только буквы и дефис.'
    )

    # Фамилия: только буквы и дефис (латиница и кириллица)
    lname_validator = RegexValidator(
        regex=r'^[a-zA-Zа-яА-ЯёЁ-]{1,}$',
        message='Фамилия может содержать только буквы и дефис.'
    )

    try:
        login_validator(log)
    except ValidationError as e:
        errors['login'] = e.messages

    try:
        password_validator(paswd)
    except ValidationError as e:
        errors['password'] = e.messages

    try:
        email_validator(email)
    except ValidationError as e:
        errors['email'] = e.messages

    try:
        date_validator(dob)
    except ValidationError as e:
        errors['dob'] = e.messages

    try:
        gender_validator(gender)
    except ValidationError as e:
        errors['gender'] = e.messages

    try:
        fname_validator(fname)
    except ValidationError as e:
        errors['fname'] = e.messages

    try:
        lname_validator(lname)
    except ValidationError as e:
        errors['lname'] = e.messages

#Валидатор формы входа
def validatelog(errors, log, paswd):
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

    try:
        login_validator(log)
    except ValidationError as e:
        errors['login'] = e.messages

    try:
        password_validator(paswd)
    except ValidationError as e:
        errors['password'] = e.messages

@csrf_exempt
def auth_back(request):

    if request.method=='GET':
        return render(request, 'mbooks/auth.html')
    
    elif request.method=='POST':
        Errors={}
        try:
            formtype=request.POST.get('type')

            if formtype!='reg' and formtype!='login':
                raise FormTypeInvalid("Invalid Form Type")
            
            if formtype=='reg':
                formlogin=request.POST.get('login')
                paswd=request.POST.get('password')
                gender=request.POST.get('gender')
                email=request.POST.get('email')
                dob=request.POST.get('dob')
                fname=request.POST.get('fname')
                lname=request.POST.get('lname')
        
                validatereg(Errors, formlogin, paswd, gender, email, dob, fname, lname)

                if(Errors!={}): raise ValidationError("Validation error")

                if User.objects.filter(username=formlogin).exists():
                    Errors['login']='Такой логин уже занят'
                    raise ValidationError("Validation existing login error")
                
                if User.objects.filter(email=email).exists():
                    Errors['email']='Такой email уже занят'
                    raise ValidationError("Validation existing email error")
                
                user=User.objects.create_user(username=formlogin, password=paswd, gender=gender, email=email,
                                              dob=dob, first_name=fname, last_name=lname, role_id=1)
                login(request, user)
                return redirect('profile')
            
            if formtype=='login':
                formlogin=request.POST.get('login')
                paswd=request.POST.get('password')

                validatelog(Errors, formlogin, paswd)

                if(Errors!={}): raise ValidationError("Validation error")

                user=authenticate(request, username=formlogin, password=paswd)
                if user is not None:
                    login(request, user)
                    return redirect('profile')
                else:
                    Errors['failedlog']='Неверный логин или пароль'
                    return JsonResponse(Errors, status=403)

        except Exception as e:
            if type(e)==FormTypeInvalid:
                return JsonResponse({'Error': 'invalid form type'}, status=403)
            else:
                print(e);
                return JsonResponse(Errors, status=403)
    else:
        return JsonResponse({'Error': 'Allowed methods: GET, POST'}, status=405)