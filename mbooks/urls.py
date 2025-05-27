from django.urls import path
from . import views

urlpatterns = [
    path('main/', views.mainpage_view, name='main'),
    path('auth/', views.auth_view, name='auth'),
    path('profile/', views.profile_view, name='profile'),
    path('catalog/', views.catalog_view, name='catalog'),
    path('book/<int:id>/', views.book_view, name='book'),
    path('basket/', views.basket_view, name='basket'),
]