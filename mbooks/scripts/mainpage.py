from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.http import JsonResponse
from mbooks.models import Book, Genre, Author, Publisher
from base64 import b64encode
from json import dumps
from .specfunc import detect_image_type
import base64


"""
Возвращает список книг в виде словарей по переданному массиву books с ключами:
'id' - айди книги
'title' - название книги
'price' - цена книги
'image' - обложка книги (в формате jpg/jpeg)
'sold' - количество проданных копий
"""
def serializeBooks(books: list) -> list:

    # Результирующий список (тот, который будет возвращён функцией serializeBooks)
    final_list: list = []

    # Проход по всему списку книг
    for book in books:
        genres = Genre.objects.filter(bookgenre__book=book).values_list('name', flat=True)
        authors = Author.objects.filter(bookauthor__book=book).values_list('name', flat=True)
        publishers = Publisher.objects.filter(bookpublisher__book=book).values_list('name', flat=True)

        # Хранит в себе закодированное изображение
        cover: str = ''
        if book.cover:
            # Хранит в себе формат изображения
            img_type: str = detect_image_type(book.cover)
            if img_type: cover = f'data:image/{img_type};base64,{b64encode(book.cover).decode("utf-8")}'

        # Добавления словаря, созданного из полей книги, в результирующий список
        final_list.append({
            'id': book.id,
            'title': book.name,
            'price': str(book.price),
            'image': cover if cover else '',
            'genre': list(genres) if genres else '',
            'author': list(authors) if authors else '',
            'publisher': list(publishers) if publishers else '',
            'sold': str(book.sold)
        })

    return final_list

# Количество книг в обоих каруселях
# (4 книги для корректной работы карусели)
ITEMS_IN_CAROUSEL: int = 4

def mainpage_back(request):
    # Выводим страницу с переданным словарём, хранящим два JSON по ключам new_books_json и bestseller_books_json
    if request.method == "GET":
        new_books: list = serializeBooks(Book.objects.filter(available=True).order_by('-id')[:ITEMS_IN_CAROUSEL])
        bestseller_books: list = serializeBooks(Book.objects.filter(available=True).order_by('-sold')[:ITEMS_IN_CAROUSEL])

        # Получаем самую свежую книгу по дате публикации
        latest_book = Book.objects.filter(available=1).order_by('-publication_date').first()
        latest_book_data = None
        if latest_book:
            cover_image = ''
            if latest_book.cover:
                img_type = detect_image_type(latest_book.cover)
                if img_type:
                    cover_image = f'data:image/{img_type};base64,{base64.b64encode(latest_book.cover).decode("utf-8")}'
            latest_book_data = {
                'id': latest_book.id,
                'name': latest_book.name,
                'cover_url': cover_image,
            }

        # Конвертируем списки в JSON и создаём из них словарь с ключами new_books_json и bestseller_books_json
        return render(request, 'mbooks/index.html', {
            'new_books_json': dumps(new_books),
            'bestseller_books_json': dumps(bestseller_books),
            'latest_book': latest_book_data,
        })

    # Ошибка: вызван неправильный метод (возможен только GET)
    return JsonResponse({'Error': 'Only GET is allowed method'}, status=405)
