$(document).ready(function() {
  // Инициализация баланса
  let currentBalance = parseInt(localStorage.getItem('userBalance')) || 0;
  updateBalanceDisplay();
  loadOrders();

  function updateBalanceDisplay() {
    $('.profile-section h3.mb-0').text(currentBalance.toLocaleString() + ' ₽');
  }

  // Загрузка заказов
  function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('userOrders')) || [];
    const currentOrdersList = $('#current-orders-list');
    const completedOrdersList = $('#completed-orders-list');
    
    currentOrdersList.empty();
    completedOrdersList.empty();

    if (orders.length === 0) {
      currentOrdersList.html('<div class="alert alert-info">У вас пока нет текущих заказов.</div>');
      completedOrdersList.html('<div class="alert alert-info">У вас пока нет завершенных заказов.</div>');
      return;
    }

    orders.forEach((order, index) => {
      const orderHtml = createOrderCard(order, index);
      if (order.status === 'completed') {
        completedOrdersList.append(orderHtml);
      } else {
        currentOrdersList.append(orderHtml);
      }
    });

    // Если нет заказов в какой-либо категории, показываем сообщение
    if (currentOrdersList.children().length === 0) {
      currentOrdersList.html('<div class="alert alert-info">У вас пока нет текущих заказов.</div>');
    }
    if (completedOrdersList.children().length === 0) {
      completedOrdersList.html('<div class="alert alert-info">У вас пока нет завершенных заказов.</div>');
    }
  }

  // Создание карточки заказа
  function createOrderCard(order, index) {
    const orderDate = new Date(order.date).toLocaleDateString('ru-RU');
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    return `
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Заказ #${index + 1}</h5>
            <small class="text-muted">Дата: ${orderDate}</small>
          </div>
          <span class="badge ${order.status === 'completed' ? 'bg-success' : 'bg-primary'}">
            ${order.status === 'completed' ? 'Завершен' : 'В обработке'}
          </span>
        </div>
        <div class="card-body">
          <div class="order-items">
            ${order.items.map(item => `
              <div class="d-flex align-items-center mb-3">
                <img src="${item.image}" alt="${item.title}" class="rounded" style="width: 60px; height: 80px; object-fit: cover;">
                <div class="ms-3">
                  <h6 class="mb-1">${item.title}</h6>
                  <p class="text-muted mb-0">Количество: ${item.quantity || 1}</p>
                </div>
                <div class="ms-auto text-end">
                  <div class="h6 mb-0">${(item.price * (item.quantity || 1)).toLocaleString()} ₽</div>
                </div>
              </div>
            `).join('')}
          </div>
          <hr>
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Итого:</h5>
            <h5 class="mb-0">${totalAmount.toLocaleString()} ₽</h5>
          </div>
        </div>
      </div>
    `;
  }

  // Переключение между разделами профиля
  $('.btn-profile-menu').on('click', function() {
    $('.btn-profile-menu').removeClass('active');
    $(this).addClass('active');
    var section = $(this).data('section');
    $('.profile-section').hide();
    $('#' + section).show();
    
    if (section === 'profile-orders') {
      loadOrders();
    }
  });

  // Форматирование номера карты
  $('#balanceForm input[placeholder="0000 0000 0000 0000"]').on('input', function() {
    let value = $(this).val().replace(/\D/g, '');
    let formattedValue = '';
    for(let i = 0; i < value.length; i++) {
      if(i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    $(this).val(formattedValue);
  });

  // Форматирование срока действия карты
  $('#balanceForm input[placeholder="ММ/ГГ"]').on('input', function() {
    let value = $(this).val().replace(/\D/g, '');
    if(value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    $(this).val(value);
  });

  // Только цифры для CVV
  $('#balanceForm input[placeholder="000"]').on('input', function() {
    $(this).val($(this).val().replace(/\D/g, ''));
  });

  // Обработка отправки формы пополнения баланса
  $('#balanceForm').on('submit', function(e) {
    e.preventDefault();
    
    const cardNumber = $('#balanceForm input[placeholder="0000 0000 0000 0000"]').val();
    const expiryDate = $('#balanceForm input[placeholder="ММ/ГГ"]').val();
    const cvv = $('#balanceForm input[placeholder="000"]').val();
    const amount = parseInt($('#balanceForm input[type="number"]').val());

    if(!cardNumber || !expiryDate || !cvv || !amount) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if(amount <= 0) {
      alert('Сумма пополнения должна быть больше 0');
      return;
    }

    // Обновляем баланс
    currentBalance += amount;
    localStorage.setItem('userBalance', currentBalance);
    updateBalanceDisplay();

    // Обновление профиля
$('#personal-data-form').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append('type', 'update_profile');
    
    fetch('/profile/', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert('Данные обновлены!');
        } else {
            Object.entries(data.errors).forEach(([field, messages]) => {
                $(`#${field}`).addClass('is-invalid').next('.invalid-feedback').text(messages[0]);
            });
        }
    });
});
//смена email
$('#saveEmailBtn').on('click', function() {
    const formData = new FormData();
    formData.append('type', 'change_email');
    formData.append('new_email', $('#newEmail').val());

    fetch('/profile/', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Для передачи кук
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Email успешно изменен!');
            $('#emailModal').modal('hide');
            // Обновляем email на странице
            $('#currentEmail').val(data.new_email); 
        } else {
            // Вывод ошибок
            Object.entries(data.errors).forEach(([field, messages]) => {
                $(`#${field}`).addClass('is-invalid').next('.invalid-feedback').text(messages[0]);
            });
        }
    });
});
// Смена пароля
$('#savePasswordBtn').click(function() {
    const formData = new FormData();
    formData.append('type', 'change_password');
    formData.append('current_password', $('#currentPassword').val());
    formData.append('new_password', $('#newPassword').val());
    formData.append('confirm_password', $('#confirmPassword').val());

    fetch('/profile/', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            $('#passwordModal').modal('hide');
            alert('Пароль изменен!');
        } else {
            handleErrors(data.errors);
        }
    });
});



// Удаление аккаунта
$('#confirmDeleteBtn').click(function() {
    fetch('/profile/', {
        method: 'POST',
        body: new FormData().append('type', 'delete_account')
    })
    .then(r => r.json())
    .then(data => {
        if (data.redirect) {
            window.location.href = data.redirect;
        }
    });
});

function handleErrors(errors) {
    Object.entries(errors).forEach(([field, messages]) => {
        $(`#${field}`).addClass('is-invalid').next('.invalid-feedback').text(messages[0]);
    });
}
    // Здесь должна быть логика отправки данных на сервер
      //При добавлении отправки формы с помощью fetch, используя метод POST (Защиту от CSRF можно не реализовывать)
  //Собрать поля формы в const formData = new FormData();
  //Например formData.append('<Имя поля>', <имя формы в коде>.<имя поля в html>.value);
  //Передавать параметры формы с именами и дополнительный параметр следующего вида:
  // formData.append('type', 'deposit')  при регистрации
  // 

  /*
    полный список параметров, ожидаемый на бекенде при пополенении:
    
    'type' значение 'deposit'
    'card_num' номер карты
    'date' дата (MM-YY)
    'cvv' cvv
    'summ' сумма пополнения
  */

  //Словарь ошибок errors вернётся с такими же названиями полей в качестве ключей
  //значениями будут строки, которые нужно выводить у соответсвующих полей

  /*
    Список параметров, ожидаемый на бекенде при внесении изменений в профиль:

    'type' с возможными значениями: 'update_profile', 'change_password', 'change_email', 'delete_account', 'logout'
    
    Далее список ожидаемых параметров в зависимости от типа формы
    **********************
    'update_profile'

    'fname'
    'lname'
    'gender'
    'dob'
    ***********************
    'change_password'

    'current_password' <- нужно добавить поле
    'new_password'
    confirm_password'  <- нужно добавить поле
    ***********************
    'change_email'

    'new_email'
    ***********************
    У 'delete_account' и 'logout' только 'type'
    
  */

  
    alert('Баланс успешно пополнен');
    this.reset();
  });

  // Обработка подтверждения выхода из аккаунта
  $('#confirmLogoutBtn').on('click', function() {
    localStorage.removeItem('user');
    localStorage.removeItem('userBalance'); // Очищаем баланс при выходе
    window.location.href = 'auth.html';
  });

  // Обработка подтверждения удаления аккаунта
  $('#confirmDeleteBtn').on('click', function() {
    localStorage.removeItem('user');
    localStorage.removeItem('userBalance'); // Очищаем баланс при удалении
    window.location.href = 'auth.html';
  });

  // Обработка изменения пароля
  $('#savePasswordBtn').on('click', function() {
    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Новые пароли не совпадают');
      return;
    }

    // Здесь должна быть логика отправки данных на сервер
    $('#passwordModal').modal('hide');
    $('#passwordChangeForm')[0].reset();
    alert('Пароль успешно изменен');
  });

  // Обработка изменения email
  $('#saveEmailBtn').on('click', function() {
    const newEmail = $('#newEmail').val();

    if (!newEmail) {
      alert('Пожалуйста, введите новый email');
      return;
    }

    // Здесь должна быть логика отправки данных на сервер
    $('#emailModal').modal('hide');
    $('#emailChangeForm')[0].reset();
    alert('Email успешно изменен');
  });

  // Очистка форм при закрытии модальных окон
  $('.modal').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
  });
}); 