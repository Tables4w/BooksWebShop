from django.urls import path
from . import views
urlpatterns = [
    path('main/', views.mainpage_view, name='main'),
    path('auth/', views.auth_view, name='auth'),
    path('profile/', views.profile_view, name='profile'),
]