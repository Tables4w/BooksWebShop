from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import AbstractUser

class Gender(models.TextChoices):
    male = 'м', 'мужчина'
    female = 'ж', 'женщина'

class Role(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name

class User(AbstractUser):
    first_name = models.CharField(max_length=100, null=False)
    last_name = models.CharField(max_length=100, null=False)
    dob = models.DateField(null=False)
    gender = models.CharField(max_length=20, choices=Gender, null=True)
    email = models.EmailField(max_length=255, unique=True, null=False)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    role = models.ForeignKey(Role, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Book(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
    description = models.TextField(blank=True, null=True)
    publication_date = models.DateField(null=False)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cover = models.BinaryField()
    sold = models.PositiveIntegerField()

    def __str__(self):
        return self.name

class Genre(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name

class BookGenre(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)

    class Meta:
        unique_together = ["book", "genre"]

class Author(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name

class BookAuthor(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)

class Publisher(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name

class BookPublisher(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE)

    class Meta:
        unique_together = ["book", "publisher"]

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    class Meta:
        unique_together = ["user", "book"]

class OrderStatus(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.name

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.ForeignKey(OrderStatus, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"order {self.id} by {self.user.id}"


class Purchase(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.PROTECT)
    count = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.book.name} in order #{self.order.id}"