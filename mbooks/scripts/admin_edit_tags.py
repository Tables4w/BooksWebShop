from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse
from mbooks.models import *
from django.db import transaction
import json

def fillAuGePudata():
     AuGePudata = {'authors':list(Author.objects.values_list('name', flat=True)),
                    'genres':list(Genre.objects.values_list('name',flat=True)),
                    'publishers':list(Publisher.objects.values_list('name',flat=True))}
     return AuGePudata

def admin_edit_tags_back(request):
    if request.method=='GET':
        tags=fillAuGePudata()
        json_tags=json.dumps(tags)
        return render(request, 'mbooks/my_admin/edit_tags.html',{'tags_json':json_tags})
    
    elif request.method=='POST':
        ftype=request.POST.get('formtype')
        if ftype=='add':
            tagtype=request.POST.get('type')
            name=request.POST.get('value')

            try:
                if tagtype=='authors':
                    Author.objects.create(name=name)
                elif tagtype=='genres':
                    Genre.objects.create(name=name)
                elif tagtype=='publishers':
                    Publisher.objects.create(name=name)
                else:
                    JsonResponse({'error':'Нет такого типа тэгов'}, status=400)
                
                return JsonResponse({'success':'Тег успешно создан'}, status=201)
            
            except Exception as e:
                return JsonResponse({'error':'Ошибка вставки тэга: '+ e}, status=400)
            
        elif ftype=='del':
            tagtype=request.POST.get('type')
            name=request.POST.get('value')
            
            print(tagtype," ",name);

            try:
                if tagtype=='author':
                    aut=Author.objects.get(name=name);
                    with transaction.atomic(): aut.delete()
                elif tagtype=='genre':
                    gnr=Genre.objects.get(name=name);
                    with transaction.atomic(): gnr.delete()
                elif tagtype=='publisher':
                    pub=Publisher.objects.get(name=name);
                    with transaction.atomic(): pub.delete()
                else:
                    JsonResponse({'error':'Нет такого типа тэгов'}, status=400)
                
                return JsonResponse({'success':'Тег успешно создан'}, status=200)
            
            except Exception as e:
                return JsonResponse({'error':'Ошибка удаления тэга: '+ e}, status=400)
            
        else:
            return JsonResponse({'error':'Неизвестное действие'}, status=400)
    else:
        return JsonResponse({'error':'Разрешены только POST и GET'}, status=405)
                    
