$(document).ready(function() {
  //console.log('[basket.js] Document is ready. Script started.'); // Лог начала скрипта
  // Загрузка корзины при открытии страницы
  loadCart();
  updateCartTotal();
  updateBalanceDisplay();
});

function updateBalanceDisplay() {
  const balance = parseInt(localStorage.getItem('userBalance')) || 0;
  $('#user-balance').text(balance.toLocaleString() + ' ₽');
  updateBalanceAfterPurchase();
}

function updateBalanceAfterPurchase() {
  const balance = parseInt(localStorage.getItem('userBalance')) || 0;
  const total = getTotalPrice();
  const remaining = balance - total;
  $('#balance-after-purchase').text(remaining.toLocaleString() + ' ₽');
  
  // Изменяем цвет текста в зависимости от остатка
  if (remaining < 0) {
    $('#balance-after-purchase').removeClass('text-success').addClass('text-danger');
  } else {
    $('#balance-after-purchase').removeClass('text-danger').addClass('text-success');
  }
}

function getTotalPrice() {
  let total = 0;
  $('.item-checkbox:checked').each(function() {
    const index = $(this).data('index');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart[index];
    if (item) {
      total += parseInt(item.price) * (item.quantity || 1);
    }
  });
  return total;
}

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || cart.map((_, index) => index);
  const cartItems = $('#cart-items');
  cartItems.empty();

  if (cart.length === 0) {
    cartItems.html('<p class="text-center text-muted my-5">Корзина пуста</p>');
    localStorage.setItem('selectedItems', JSON.stringify([]));
    return;
  }

  cart.forEach((item, index) => {
    const isChecked = selectedItems.includes(index);
    const quantity = item.quantity || 1;
    const itemHtml = `
      <div class="cart-item d-flex align-items-center p-3 border-bottom">
        <div class="cart-item-checkbox me-3">
          <input type="checkbox" class="form-check-input item-checkbox" 
                 data-index="${index}" data-price="${item.price}" 
                 ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;">
        </div>
        <div class="cart-item-image" style="width: 100px;">
          <img src="${item.image}" alt="${item.title}" class="img-fluid rounded">
        </div>
        <div class="cart-item-details flex-grow-1 px-4">
          <h5 class="mb-1">${item.title}</h5>
          <p class="text-muted mb-0">Автор: ${item.author || 'Не указан'}</p>
        </div>
        <div class="cart-item-price text-end" style="width: 200px;">
          <div class="quantity-controls d-flex align-items-center justify-content-end mb-2">
            <button class="btn btn-sm btn-outline-secondary me-2 decrease-quantity" data-index="${index}">-</button>
            <span class="quantity-display">${quantity}</span>
            <button class="btn btn-sm btn-outline-secondary ms-2 increase-quantity" data-index="${index}">+</button>
          </div>
          <div class="h5 mb-0">${item.price * quantity} ₽</div>
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeFromCart(${index})">
            Удалить
          </button>
        </div>
      </div>
    `;
    cartItems.append(itemHtml);
  });

  // Обработчики изменения количества
  $('.decrease-quantity').click(function() {
    const index = $(this).data('index');
    updateQuantity(index, -1);
  });

  $('.increase-quantity').click(function() {
    const index = $(this).data('index');
    updateQuantity(index, 1);
  });

  // Обработчик изменения чекбоксов
  $('.item-checkbox').change(function() {
    const selectedIndexes = [];
    $('.item-checkbox').each(function() {
      if ($(this).is(':checked')) {
        selectedIndexes.push($(this).data('index'));
      }
    });
    localStorage.setItem('selectedItems', JSON.stringify(selectedIndexes));
    updateTotalPrice();
    updateBalanceAfterPurchase();
  });

  updateTotalPrice();
}

function updateQuantity(index, change) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart[index]) {
    cart[index].quantity = (cart[index].quantity || 1) + change;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  }
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  
  cart.splice(index, 1);
  selectedItems = selectedItems.filter(itemIndex => itemIndex !== index)
    .map(itemIndex => itemIndex > index ? itemIndex - 1 : itemIndex);
  
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
  loadCart();
  updateTotalPrice();
}

function updateTotalPrice() {
  let total = 0;
  $('.item-checkbox:checked').each(function() {
    const index = $(this).data('index');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart[index];
    if (item) {
      total += parseInt(item.price) * (item.quantity || 1);
    }
  });
  $('#cart-total-price').text(total.toLocaleString() + ' ₽');
  updateCartTotal();
  updateBalanceAfterPurchase();
}

function updateCartTotal() {
  let total = 0;
  $('.item-checkbox:checked').each(function() {
    const index = $(this).data('index');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart[index];
    if (item) {
      total += parseInt(item.price) * (item.quantity || 1);
    }
  });
  $('#cart-total').text(total.toLocaleString() + ' ₽');
}

// Обработчик кнопки оформления заказа
$('#checkout-btn').click(function() {
  //console.log('[basket.js] Checkout button click handler entered.'); // Лог входа в обработчик
  //console.log('[basket.js] Checkout button clicked'); // Лог нажатия кнопки
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  //console.log('[basket.js] Current cart:', cart); // Лог текущей корзины
  
  //console.log('[basket.js] Checking if cart is empty.'); // Лог перед проверкой пустой корзины
  if (cart.length === 0) {
    //console.log('[basket.js] Cart is empty. Returning.'); // Лог пустой корзины
    return;
  }
  
  //console.log('[basket.js] Checking selected items.'); // Лог перед проверкой выбранных товаров
  // Получаем только выбранные товары
  const selectedItems = [];
  $('.item-checkbox:checked').each(function() {
    const index = $(this).data('index');
    selectedItems.push(cart[index]);
  });
  //console.log('[basket.js] Selected items:', selectedItems); // Лог выбранных товаров

  //console.log('[basket.js] Checking if no items selected.'); // Лог перед проверкой отсутствия выбранных товаров
  if (selectedItems.length === 0) {
    //console.log('[basket.js] No items selected. Returning.'); // Лог отсутствия выбранных товаров
    return;
  }

  //console.log('[basket.js] Calculating total price and checking balance.'); // Лог перед проверкой баланса
  const total = getTotalPrice();
  const balance = parseInt(localStorage.getItem('userBalance')) || 0;
  //console.log('[basket.js] Total price:', total, 'Balance:', balance); // Лог суммы и баланса

  if (balance < total) {
    //console.log('[basket.js] Insufficient balance. Redirecting.'); // Лог недостаточного баланса
    alert('Недостаточно средств. Пожалуйста, пополните баланс.');
    window.location.href = '/profile/';
    return;
  }
  
  //console.log('[basket.js] Creating order data.'); // Лог перед созданием данных заказа
  // Создаем данные заказа в правильном формате
  const orderData = {
    items: selectedItems.map(item => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity || 1
    }))
  };
  //console.log('[basket.js] Sending order data:', orderData); // Лог отправляемых данных

  //console.log('[basket.js] About to send fetch POST request to /basket/'); // Лог перед fetch
  fetch('/basket/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  })
  .then(response => {
    //console.log('[basket.js] Server response status:', response.status); // Лог статуса ответа
    if (!response.ok) {
      throw new Error('Ошибка при отправке заказа');
    }
    return response.json();
  })
  .then(data => {
    //console.log('[basket.js] Order created successfully:', data); // Лог успешного создания заказа
    // Очищаем корзину
    const remainingItems = cart.filter((item, index) => 
      !$('.item-checkbox:checked').toArray().some(cb => $(cb).data('index') === index)
    );
    
    localStorage.setItem('cart', JSON.stringify(remainingItems));
    localStorage.setItem('selectedItems', JSON.stringify([]));
    
    // Обновляем баланс
    const newBalance = balance - total;
    localStorage.setItem('userBalance', newBalance);
    
    // Обновляем отображение
    loadCart();
    updateBalanceDisplay();
    
    //console.log('[basket.js] Order successful. Delaying redirect to profile.'); // Лог перед задержкой
    // Перенаправляем на страницу профиля с небольшой задержкой
    setTimeout(() => {
      //console.log('[basket.js] Redirecting to profile now.'); // Лог перед редиректом
      window.location.href = '/profile/';
    }, 1000); // Уменьшена задержка до 1000 миллисекунд
  })
  .catch(error => {
    //console.error('[basket.js] Error creating order:', error); // Лог ошибки
    alert('Произошла ошибка при создании заказа. Пожалуйста, попробуйте снова.');
  });
  
  //console.log('[basket.js] Checkout button click handler finished.'); // Лог завершения обработчика
}); 