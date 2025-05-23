from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from mbooks.models import *
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from mbooks.scripts.auth import FormTypeInvalid
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.http import JsonResponse

User=get_user_model()


#Валидация данных карты и суммы пополнения
def deposit_info_validate(errors, card_num, date, cvv, summ):
    card_num_validate = RegexValidator(
        regex=r'^[0-9]{12}$',
        message='Номер карты может содержать только цифры, длина номера карты 12 символов'
    )
    date_validate = RegexValidator(
        regex=r'^\d{2}-\d{2}$',
        message='Введите дату в формате MM-YY.'
    )
    cvv_validate = RegexValidator(
        regex=r'^[0-9]{3}$',
        message='CVV может содержать только 3 цифры'

    )
    summ_validate = RegexValidator(
        regex=r'^(?!0\d)\d{1,12}(?:\.\d{1,2})?$',
        message='Не корректная сумма'
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
    



@login_required(login_url='/auth/')
def profile_back(request):
    if request.method=='GET':
        return render(request, 'mbooks/profile.html')
    
    elif request.method=='POST':
        try:
            formtype=request.POST.get('type')

            #Если тип формы не депозит: ошибка, в дальнейшем добавить другие формы 
            if formtype!='deposit':
                raise FormTypeInvalid("Invalid Form Type")
            #Если тип формы депозит выполняется пополнение    
            if formtype=='deposit':

                card_num=request.POST.get('card_num')
                date=request.POST.get('date')
                cvv=request.POST.get('cvv')
                summ=request.POST.get('summ')
                errors={}

                deposit_info_validate(errors,card_num,date,cvv,summ)
                if errors!={}:
                    raise ValidationError
                
                request.user.balance += Decimal(summ)
                request.user.save()
                
                return JsonResponse({'success':'Баланс успешно пополнен'})
        except Exception as e:
            if type(e)==FormTypeInvalid:
                return JsonResponse({'Error': 'invalid form type'}, status=403)
            else:
                
                return JsonResponse(errors, status=403)
    else:
        JsonResponse({'Error': 'Allowed methods: GET, POST'}, status=405)            

            








        
        
        
        