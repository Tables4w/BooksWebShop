from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect
from django.http import JsonResponse
from mbooks.models import *
import json
import base64
from .specfunc import detect_image_type

User=get_user_model();

def serializeBooks(data, books):
    for book in data:
            genres = Genre.objects.filter(bookgenre__book=book).values_list('name', flat=True)
            authors = Author.objects.filter(bookauthor__book=book).values_list('name', flat=True)
            publishers = Publisher.objects.filter(bookpublisher__book=book).values_list('name', flat=True)

            cover_image = ''
            if book.cover:
                img_type = detect_image_type(book.cover)
                if img_type:
                    cover_image = f'data:image/{img_type};base64,{base64.b64encode(book.cover).decode("utf-8")}'


            books.append({
                'id': book.id,
                'title': book.name,
                'description': book.description,
                'year': book.publication_date.isoformat()[0:4],
                'price': str(book.price),
                'image': cover_image if cover_image else '',
                'genre': list(genres) if genres else '',
                'author': list(authors) if authors else '',
                'publisher': list(publishers) if publishers else '',
            })
    return books

def catalog_back(request):
    if request.method=='GET':
        data = Book.objects.filter(available=True)

        books = []
        
        books=serializeBooks(data, books)

        books_json=json.dumps(books)

        return render(request, 'mbooks/catalog.html', {'books_json':books_json})
    
    if request.method=='POST':
        searchstr=request.POST.get('search', '')

        print(searchstr)

        data = Book.objects.filter(name__icontains=searchstr, available=True)

        books = []
        
        books=serializeBooks(data, books)

        books_json=json.dumps(books)

        #search_json=json.dumps();

        return render(request, 'mbooks/catalog.html', {'books_json':books_json, 'searched':{'query':searchstr}})
    
    else:
        return JsonResponse({'Error': 'Allowed methods: GET, POST'}, status=405)