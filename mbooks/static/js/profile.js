$(document).ready(function() {
  // Получаем данные пользователя из localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  if (!userData) {
    // Если данных нет, перенаправляем на страницу входа
    window.location.href = '/auth/';
    return;
  }

  // Заполняем поля профиля данными пользователя
  $('#profile-username').text(userData.username);
  $('#profile-email').text(userData.email);
  $('#profile-first-name').text(userData.first_name);
  $('#profile-last-name').text(userData.last_name);
  $('#profile-birth-date').text(userData.birth_date);
  $('#profile-gender').text(userData.gender === 'м' ? 'Мужской' : 'Женский');
  $('#profile-phone').text(userData.phone);
  $('#profile-address').text(userData.address);

  // Получение данных профиля с бэкенда
  /*
  $.ajax({
    url: '/profile/',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    success: function(response) {
      // Заполняем поля профиля данными с сервера
      $('#profile-username').text(response.username);
      $('#profile-email').text(response.email);
      $('#profile-first-name').text(response.first_name || 'Не указано');
      $('#profile-last-name').text(response.last_name || 'Не указано');
      $('#profile-birth-date').text(response.birth_date || 'Не указано');
      $('#profile-gender').text(response.gender || 'Не указано');
      $('#profile-phone').text(response.phone || 'Не указано');
      $('#profile-address').text(response.address || 'Не указано');
      
      // Обновляем данные в localStorage
      localStorage.setItem('userData', JSON.stringify(response));
    },
    error: function(xhr, status, error) {
      console.error('Ошибка при получении данных профиля:', error);
    }
  });
  */

  // Обработка кнопки выхода
  $('#logout-btn').click(function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', 'logout');

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.redirect) {
        localStorage.removeItem('userData');
        window.location.href = data.redirect;
      }
    })
    .catch(error => {
      console.error('Ошибка при выходе:', error);
      alert('Произошла ошибка при попытке выхода');
    });
  });

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
      value = value.substring(0, 2) + '-' + value.substring(2, 4);
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
    
    const formData = new FormData();
    formData.append('type', 'deposit');
    formData.append('card_num', $('#balanceForm input[placeholder="0000 0000 0000 0000"]').val().replace(/\s/g, ''));
    formData.append('date', $('#balanceForm input[placeholder="ММ/ГГ"]').val());
    formData.append('cvv', $('#balanceForm input[placeholder="000"]').val());
    formData.append('sum', $('#balanceForm input[type="number"]').val());

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentBalance += parseInt(formData.get('sum'));
        localStorage.setItem('userBalance', currentBalance);
        updateBalanceDisplay();
        alert('Баланс успешно пополнен');
        this.reset();
      } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      console.error('Ошибка при пополнении баланса:', error);
      alert('Произошла ошибка при пополнении баланса');
    });
  });

  // Обновление профиля
  $('#personal-data-form').on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append('type', 'update_profile');
    
    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Данные обновлены!');
        // Обновляем данные в localStorage
        const updatedUserData = { ...userData };
        formData.forEach((value, key) => {
          if (key !== 'type') {
            updatedUserData[key] = value;
          }
        });
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
      } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      console.error('Ошибка при обновлении профиля:', error);
      alert('Произошла ошибка при обновлении данных');
    });
  });

  // Смена email
  $('#saveEmailBtn').on('click', function() {
    const formData = new FormData();
    formData.append('type', 'change_email');
    formData.append('new_email', $('#newEmail').val());

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Email успешно изменен!');
        $('#emailModal').modal('hide');
        // Обновляем email в localStorage
        userData.email = formData.get('new_email');
        localStorage.setItem('userData', JSON.stringify(userData));
        $('#profile-email').text(userData.email);
      } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      console.error('Ошибка при смене email:', error);
      alert('Произошла ошибка при смене email');
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
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        $('#passwordModal').modal('hide');
        alert('Пароль изменен!');
        $('#passwordChangeForm')[0].reset();
      } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      console.error('Ошибка при смене пароля:', error);
      alert('Произошла ошибка при смене пароля');
    });
  });

  // Удаление аккаунта
  $('#confirmDeleteBtn').click(function() {
    const formData = new FormData();
    formData.append('type', 'delete_account');

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.redirect) {
        localStorage.removeItem('userData');
        localStorage.removeItem('userBalance');
        window.location.href = data.redirect;
      }
    })
    .catch(error => {
      console.error('Ошибка при удалении аккаунта:', error);
      alert('Произошла ошибка при удалении аккаунта');
    });
  });

  // Функция обработки ошибок
  function handleErrors(errors) {
    // Очищаем предыдущие ошибки
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').text('');

    // Отображаем новые ошибки
    Object.entries(errors).forEach(([field, messages]) => {
      const input = $(`[name="${field}"]`);
      input.addClass('is-invalid');
      input.next('.invalid-feedback').text(messages[0]);
    });
  }

  // Очистка форм при закрытии модальных окон
  $('.modal').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $(this).find('.is-invalid').removeClass('is-invalid');
    $(this).find('.invalid-feedback').text('');
  });
}); 