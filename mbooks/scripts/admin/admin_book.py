from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse
from mbooks.models import *
from ..specfunc import detect_image_type
import base64
import json
from django.http import Http404
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime



#   Для определения типа изображения обложки используйте:
#   from .specfunc import detect_image_type
# Например так (подробнее в book.py):
'''
if book.cover:
    img_type = detect_image_type(book.cover)
    if img_type:
        cover_image = f'data:image/{img_type};base64,{base64.b64encode(book.cover).decode("utf-8")}'
'''

'''
    try:
        book = get_object_or_404(Book, id=id)
    except Book.DoesNotExist:
        raise Http404("Book not found")
'''

def fillbookdata(thsbk):
    if thsbk.cover:
            img_type=detect_image_type(thsbk.cover)
            if img_type:
                cover_image = f'data:image/{img_type};base64,{base64.b64encode(thsbk.cover).decode("utf-8")}'
       
    genres = Genre.objects.filter(bookgenre__book=thsbk).values_list('name', flat=True)
    authors = Author.objects.filter(bookauthor__book=thsbk).values_list('name', flat=True)
    publishers = Publisher.objects.filter(bookpublisher__book=thsbk).values_list('name', flat=True)

    bookdata={'id':thsbk.id, 'title':thsbk.name, 'description':thsbk.description, 'year':str(thsbk.publication_date),
               'price': str(thsbk.price), 'image':cover_image if cover_image else '',
               'genre':list(genres) if genres else '' ,'author': list(authors) if authors else '','publisher':list(publishers) if publishers else '',}
    return bookdata

def fillAuGePudata():
     AuGePudata = {'authors':list(Author.objects.values_list('name', flat=True)),
                    'genres':list(Genre.objects.values_list('name',flat=True)),
                    'publishers':list(Publisher.objects.values_list('name',flat=True))}
     return AuGePudata

def book_inf_validate(errors, title, author, description, price, year, publishers, genres):
     
    if not title:
        errors['title']='Название не заполнено'
    if not author or author==[]:
        errors['author']='Выберите автора'
    if not description:
        errors['description']='Описание не заполнено'
    if not year or datetime.strptime(year, "%Y-%m-%d").date() > timezone.now().date() :
        errors['year']='Выберите правильную дату'
    if not publishers:
        errors['publishers']='Выберите издателя'
    if not genres:
        errors['genres']='Выберите жанр'
    price_validate = RegexValidator(
        regex=r'^(?!0\d)\d{1,12}(?:\.\d{1,2})?$',
        message='Некорректная сумма'
    )
    try:
        price_validate(price)
    except ValidationError as e:
        errors['summ']=e.messages
    
     



def admin_book_back(request, id):

    if request.method=="GET":

        try:
            thsbk = get_object_or_404(Book, id=id)
            if(thsbk.available==False):
                raise Http404("Book not found")
        except Book.DoesNotExist:
            raise Http404("Book not found")
        
        bookdata=fillbookdata(thsbk)
        AuGePudata=fillAuGePudata()
        json_bookdata=json.dumps(bookdata)
        json_AuGePudata=json.dumps(AuGePudata)

        return render(request, 'mbooks/my_admin/book.html',{'json_bookdata':json_bookdata,'json_AuGePudata':json_AuGePudata})
    
    if request.method=="POST":

        formtype=request.POST.get('formtype')

        if formtype=='edit':
              
            title=request.POST.get('title')
            authors=request.POST.getlist('author[]')
            description=request.POST.get('description')
            price=request.POST.get('price')
            year=request.POST.get('year')
            publishers=request.POST.getlist('publishers[]')
            genres=request.POST.getlist('genres[]')
            cover=request.FILES.get('cover')
            print(title)
            
            errors={}
            book_inf_validate(errors,title,authors,description,price,year,publishers,genres)

            if errors:
                return JsonResponse({'errors': errors}, status=400)
            
            try:
                thsbk = get_object_or_404(Book, id=id)
            except Book.DoesNotExist:
                raise Http404("Book not found")
            
            thsbk.name=title
            thsbk.description=description
            thsbk.price=price
            thsbk.publication_date=year
            
            if cover:
                img=cover.read()
                thsbk.cover=img

            thsbk.save()

            #удаляем старые записи в BookGenre BookAuthor BookPublisher перед добавлением новых

            BookGenre.objects.filter(book=id).delete()
            BookAuthor.objects.filter(book=id).delete()
            BookPublisher.objects.filter(book=id).delete()

            #добавляем новые записи
            try:
                for author in authors:
                    author1 = Author.objects.get(name=author)
                    BookAuthor.objects.create(book=thsbk,author=author1)

                for publisher in publishers:
                    publisher1 = Publisher.objects.get(name=publisher)
                    BookPublisher.objects.create(book=thsbk, publisher=publisher1)

                for genre in genres:
                    genre1 = Genre.objects.get(name=genre)
                    BookGenre.objects.create(book=thsbk,genre=genre1)

                   
            except Exception as e:
               return JsonResponse({'error':'Ошибка вставки в БД'},status=400)
            
            return JsonResponse({'success': True})
            
            
        if formtype=='delete':
            print('deleting')
            try:
                thsbk = get_object_or_404(Book, id=id)
            except Book.DoesNotExist:
                raise Http404("Book not found")
            try:
                thsbk.available=False;
                thsbk.save()
            except Exception as e:
                print(e)
                return JsonResponse({'error':'Ошибка удаления'},status=400)
            return JsonResponse({'success': True})
            
    else:
        return JsonResponse({'Errors': 'Allowed methods: GET, POST'}, status=405)
                    
                    

                



            


        
