from django.urls import path
from . import views

urlpatterns = [
    path('main/', views.mainpage_view, name='main'),
    path('auth/', views.auth_view, name='auth'),
    path('profile/', views.profile_view, name='profile'),
    path('catalog/', views.catalog_view, name='catalog'),
    path('book/<int:id>/', views.book_view, name='book'),
    path('basket/', views.basket_view, name='basket'),
    path('getuserorders/', views.getuserorders_view, name='getuserorders'),
    path('my_admin/catalog/', views.admin_catalog_view, name='admin_catalog'),
    path('my_admin/book/<int:id>/', views.admin_book_view, name='admin_book'),
    path('my_admin/add_book/', views.admin_add_book_view, name='admin_add_book'),
    path('my_admin/edit_tags/', views.admin_edit_tags_view, name='admin_edit_tags'),
    path('my_admin/orders/', views.admin_orders_view, name='admin_orders')
]
