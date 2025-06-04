from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mbooks.models import *
from mbooks.scripts.specfunc import isAdm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.db import IntegrityError
from django.db import transaction
from datetime import datetime
import os
@csrf_exempt
def admin_add_book_back(request):
    if not isAdm(request):
        return redirect('/main/')

    if request.method == 'GET':
        # Обработка GET-запроса для получения данных
        if request.GET.get('type') == 'get_data':
            authors = list(Author.objects.values_list('name', flat=True))
            genres = list(Genre.objects.values_list('name', flat=True))
            publishers = list(Publisher.objects.values_list('name', flat=True))
            return JsonResponse({
                'authors': authors,
                'genres': genres,
                'publishers': publishers
            })
        else:
            # Отображение страницы
            return render(request, 'mbooks/my_admin/add_book.html')
    
    elif request.method == 'POST':
        
        if request.POST.get('type') != 'add_book':
            return JsonResponse({'message': 'Неверный тип запроса'}, status=400)

        try:
            title=request.POST.get('title')
            authors=request.POST.getlist('author')
            description=request.POST.get('description')
            price=request.POST.get('price')
            year=request.POST.get('year')
            publishers=request.POST.getlist('publishers')
            genres=request.POST.getlist('genres')
            cover=request.FILES.get('cover')
            if cover:
                img=cover.read()
            else:
        
                default_image_path = os.path.join('mbooks','static', 'notcover.jpg')
                with open(default_image_path, 'rb') as f:
                    img = f.read()
                


            with transaction.atomic():
                # Создание книги
                book = Book.objects.create(
                    name=title,
                    description=description,
                    price=price,
                    publication_date=year,
                    cover=img  
                )

                # Привязка авторов
                for author_name in authors:
                    author, _ = Author.objects.get_or_create(name=author_name.strip())
                    BookAuthor.objects.create(book=book, author=author)

                # Привязываем жанры
                for genre_name in genres:
                    genre, _ = Genre.objects.get_or_create(name=genre_name.strip())
                    BookGenre.objects.create(book=book, genre=genre)

                # Привязываем издательства
                for publisher_name in publishers:
                    publisher, _ = Publisher.objects.get_or_create(name=publisher_name.strip())
                    BookPublisher.objects.create(book=book, publisher=publisher)

            return JsonResponse({'message': 'Книга успешно добавлена'}, status=201)

        except Exception as e:
            return JsonResponse({'message': f'Ошибка: {str(e)}'}, status=500)
    else:
        return JsonResponse({'message': 'Метод не разрешён'}, status=405)