from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from mbooks.models import *
import json
import base64
from .specfunc import detect_image_type

def book_back(request, id):
    try:
        book = get_object_or_404(Book, id=id)
    except Book.DoesNotExist:
        raise Http404("Book not found")
    
    genres = Genre.objects.filter(bookgenre__book=book).values_list('name', flat=True)
    authors = Author.objects.filter(bookauthor__book=book).values_list('name', flat=True)
    publishers = Publisher.objects.filter(bookpublisher__book=book).values_list('name', flat=True)

    cover_image = ''
    if book.cover:
        img_type = detect_image_type(book.cover)
        if img_type:
            cover_image = f'data:image/{img_type};base64,{base64.b64encode(book.cover).decode("utf-8")}'

    data=[]

    data.append({
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

    books_json=json.dumps(data)

    print(data)

    return render(request, 'mbooks/book.html', {'books_json':books_json})