function addToCart(bookId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  const book = books[0];
  
  if (book) {
    const existingItem = cart.find(item => item.id === bookId);

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({
        id: bookId,
        title: book.title,
        price: book.price,
        author: book.author,
        image: book.image,
        quantity: 1
      });
      selectedItems.push(cart.length - 1);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    updateCartTotal();
  }
}

function updateCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  const total = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) {
      return sum + parseInt(item.price) * (item.quantity || 1);
    }
    return sum;
  }, 0);
  $('#cart-total').text(parseInt(total) + ' ₽');
}

// Функция для синхронизации состояния корзины
function syncCartState() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  
  // Обновляем сумму корзины
  const total = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) {
      return sum + parseInt(item.price);
    }
    return sum;
  }, 0);
  
  $('#cart-total').text(parseInt(total) + ' ₽');
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

  updateCartTotal()
});
