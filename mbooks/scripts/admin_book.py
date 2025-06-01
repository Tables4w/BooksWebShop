from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.http import JsonResponse

#   Для определения типа изображения обложки используйте:
#   from .specfunc import detect_image_type
# Например так (подробнее в book.py):
'''
if book.cover:
    img_type = detect_image_type(book.cover)
    if img_type:
        cover_image = f'data:image/{img_type};base64,{base64.b64encode(book.cover).decode("utf-8")}'
'''

def admin_book_back(request, id):
    '''
    try:
        book = get_object_or_404(Book, id=id)
    except Book.DoesNotExist:
        raise Http404("Book not found")
    '''
    return render(request, 'mbooks/my_admin/book.html')