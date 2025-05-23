from django.http import JsonResponse
from django.shortcuts import render
from mbooks.models import Book
from base64 import b64encode
from json import dumps
from .specfunc import detect_image_type


# Не зря же писал эту функцию?.. да? ;(
"""
# Возвращает список книг в виде словарей из books-data.js (надеюсь, он для этого...)
def load_books_data() -> list:

    with open(join(settings.BASE_DIR, 'mbooks/static/js/books-data.js'), encoding='utf-8') as f:
        text: str = f.read()

    m = re.search(r'const\s+books\s*=\s*(\[[\s\S]*?\]);', text)
    if not m: return []

    data: list = []
    try: data = json.loads(re.sub(r'(\b\w+\b)\s*:', r'"\1":', m.group(1).rstrip().rstrip(';')))
    except json.JSONDecodeError as e: print(f"Неудалось привести к JSON из books-data.js: {e}")

    return data
"""


"""
Возвращает список книг в виде словарей по переданному массиву new_books с ключами:
'id' - айди книги
'title' - название книги
'price' - цена книги
'image' - обложка книги (в формате jpg/jpeg)
"""
def serializeBooks(new_books: list) -> list:

    # Результирующий список (тот, который будет возвращён функцией serializeBooks)
    final_list: list = []

    # Проход по всему списку книг
    for book in new_books:
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
            'sold': str(book.sold)
        })

    return final_list

# Количество книг в обоих каруселях
ITEMS_IN_CAROUSEL: int = 6

def mainpage_back(request):
    # Выводим страницу с переданным словарём, хранящим два JSON по ключам new_books_json и bestseller_books_json
    if request.method == "GET":
        new_books: list = serializeBooks(Book.objects.order_by('-id')[:ITEMS_IN_CAROUSEL])
        bestseller_books: list = serializeBooks(Book.objects.order_by('-sold')[:ITEMS_IN_CAROUSEL])

        # Конвертируем списки в JSON и создаём из них словарь с ключами new_books_json и bestseller_books_json
        return render(request, 'mbooks/index.html', {
            'new_books_json': dumps(new_books),
            'bestseller_books_json': dumps(bestseller_books)
        })

    # Ошибка: вызван неправильный метод (возможен только GET)
    return JsonResponse({'Error': 'Only GET is allowed method'}, status=405)