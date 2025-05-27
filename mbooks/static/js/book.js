function addToCart(bookId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  const book = books[0];
  
  if (book) {
    cart.push({
      id: bookId,
      title: book.title,
      author: book.author,
      price: book.price,
      image: book.image
    });
    selectedItems.push(cart.length - 1);
    
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    updateCartTotal();

    // Проверяем, авторизован ли пользователь
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      // Отправляем ID книги на бэкенд
      /*
      $.ajax({
        url: '/api/cart/add/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        data: JSON.stringify({
          book_id: bookId
        }),
        success: function(response) {
          console.log('Книга успешно добавлена в корзину на сервере');
        },
        error: function(xhr, status, error) {
          console.error('Ошибка при добавлении книги в корзину:', error);
        }
      });
      */
    }
  }
}

function updateCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  const total = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) {
      return sum + parseFloat(item.price);
    }
    return sum;
  }, 0);
  
  // Обновляем отображение суммы в корзине в шапке
  $('#cart-total').text(parseFloat(total).toFixed(2) + ' ₽');
}

// Функция для синхронизации состояния корзины
function syncCartState() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  
  // Обновляем сумму корзины
  const total = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) {
      return sum + parseFloat(item.price);
    }
    return sum;
  }, 0);
  
  $('#cart-total').text(parseFloat(total).toFixed(2) + ' ₽');
}

$(document).ready(function () {
  // Синхронизируем состояние корзины при загрузке страницы
  syncCartState();
  
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = parseInt(urlParams.get("id"));

  const book = books[0];

  if (book) {
    $('#book-title').text(book.title);
    $('#book-author').text(Array.isArray(book.author) ? book.author.join(', ') : '');
    $('#book-description').text(book.description);
    $('#book-year').text(book.year);
    $('#book-price').text(book.price + ' ₽');
    $('#book-publisher').text(Array.isArray(book.publisher) ? book.publisher.join(', ') : '');
    $('#book-genre').text(Array.isArray(book.genre) ? book.genre.join(', ') : '');
    $('#book-image').attr('src', book.image);

    $('#buy-btn').click(function () {
      addToCart(book.id);
    });
  } else {
    $('main').html('<div class="text-center text-danger">Книга не найдена</div>');
  }
});