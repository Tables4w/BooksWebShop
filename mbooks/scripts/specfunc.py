from django.shortcuts import redirect
from django.contrib.auth.models import AnonymousUser

def detect_image_type(binary_data):
    if binary_data.startswith(b'\xff\xd8'):
        return 'jpeg'
    elif binary_data.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    else:
        return None
    
# Функция проверки, является ли пользователь администратором?
def isAdm(request):
    if not request.user.is_authenticated:
        return False
    return str(request.user.role)=='administrator' or str(request.user.role)=='manager'