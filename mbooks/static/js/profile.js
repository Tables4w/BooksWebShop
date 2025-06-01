$(document).ready(function() {
  // Получаем данные пользователя из localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  if (!userData) {
    // Если данных нет, перенаправляем на страницу входа
    window.location.href = '/auth/';
    return;
  }

  // Проверяем существование кнопки выхода
  const logoutBtn = $('#confirmLogoutBtn');
  console.log('Logout button found:', logoutBtn.length > 0); // Debug log

  if (logoutBtn.length > 0) {
    logoutBtn.on('click', function(e) {
      //console.log('Logout button clicked'); // Debug log
      e.preventDefault();
      e.stopPropagation();
      //alert('Logout button clicked'); // Debug alert
      try {
        const formData=new FormData()
        formData.append('type', 'logout')

        fetch('/profile/', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Очищаем все данные пользователя из localStorage
              //localStorage.clear(); // Очищаем все данные из localStorage
              localStorage.removeItem('userData');
              localStorage.removeItem('userBalance');
              //alert('LocalStorage cleared'); // Debug alert
              // Перенаправляем на страницу входа
              window.location.href = '/auth/';
            } else {
              handleErrors(data.errors);
            }
          })
          .catch(error => {
            console.error('Ошибка при выходе:', error);
          });
      } catch (error) {
        alert('Error during logout: ' + error.message); // Debug alert
      }
    });
  } else {
    console.error('Logout button not found in DOM'); // Debug log
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

  // Инициализация баланса
  let balance = parseFloat($('#user-balance').val());
  localStorage.setItem('userBalance', balance)
  let currentBalance = parseInt(localStorage.getItem('userBalance')) || 0;
  updateBalanceDisplay();
  loadOrders();

  function updateBalanceDisplay() {
    $('.profile-section h3.mb-0').text(currentBalance.toLocaleString() + ' ₽');
  }

  //Pагрузка заказов из бд
  function loadOrders() {
  const currentOrdersList = $('#current-orders-list');
  const completedOrdersList = $('#completed-orders-list');

  currentOrdersList.empty();
  completedOrdersList.empty();

  fetch('/getuserorders/')
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка при получении заказов');
      }
      return response.json();
    })
    .then(orders => {
      if (orders.length === 0) {
        currentOrdersList.html('<div class="alert alert-info">У вас пока нет текущих заказов.</div>');
        completedOrdersList.html('<div class="alert alert-info">У вас пока нет завершенных заказов.</div>');
        return;
      }

      orders.forEach((order, index) => {
        const orderHtml = createOrderCard(order, order.id);
        console.log(order.status);
        if (order.status === 'Оформлен' || order.status==='Готов к получению') {
          currentOrdersList.append(orderHtml);
        } else if(order.status === 'Получен' || order.status==='Отказ') {
          completedOrdersList.append(orderHtml);
        }
      });

      if (currentOrdersList.children().length === 0) {
        currentOrdersList.html('<div class="alert alert-info">У вас пока нет текущих заказов.</div>');
      }
      if (completedOrdersList.children().length === 0) {
        completedOrdersList.html('<div class="alert alert-info">У вас пока нет завершенных заказов.</div>');
      }
    })
    .catch(error => {
      console.error('Ошибка загрузки заказов:', error);
      currentOrdersList.html('<div class="alert alert-danger">Не удалось загрузить заказы.</div>');
      completedOrdersList.html('<div class="alert alert-danger">Не удалось загрузить заказы.</div>');
    });
}

  // Создание карточки заказа
  function createOrderCard(order, index) {
    const orderDate = new Date(order.date).toLocaleDateString('ru-RU');
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    return `
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Заказ #${index}</h5>
            <small class="text-muted">Дата: ${orderDate}</small>
          </div>
          <span class="badge ${order.status === 'completed' ? 'bg-success' : 'bg-primary'}">
            ${order.status}
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

  // Обработка отправки формы пополнения баланса
  $('#balanceForm').on('submit', function(e) {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    
    // Получаем значения полей по placeholder
    const cardNum = $('#balanceForm input[placeholder="0000 0000 0000 0000"]').val();
    const date = $('#balanceForm input[placeholder="ММ/ГГ"]').val();
    const cvv = $('#balanceForm input[placeholder="000"]').val();
    const sum = parseInt($('#balanceForm input[type="number"]').val());

    console.log('Form data:', { cardNum, date, cvv, sum }); // Debug log

    // Валидация
    if (!cardNum || !date || !cvv || !sum) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    if (cardNum.replace(/\s/g, '').length !== 16) {
      alert('Номер карты должен содержать 16 цифр');
      return;
    }

    if (sum <= 0) {
      alert('Сумма пополнения должна быть больше 0');
      return;
    }

    const formData = new FormData();
    formData.append('type', 'deposit');
    formData.append('cardNum', cardNum);
    formData.append('date', date);
    formData.append('cvv', cvv);
    formData.append('summ', sum);

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentBalance += sum;
        localStorage.setItem('userBalance', currentBalance);
        updateBalanceDisplay();
        this.reset();
        alert('Баланс успешно пополнен');
        } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      console.error('Ошибка при пополнении', error);
      alert('Произошла ошибка при пополнении');
    });

    // Обновляем баланс
    
    
    // Очищаем форму
    
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
  $('#confirmDeleteBtn').on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    alert('Delete button clicked'); // Debug alert
    try {
      const formData=new FormData()
      formData.append('type', 'delete_account')

      fetch('/profile/', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Очищаем все данные пользователя из localStorage
          //localStorage.clear(); // Очищаем все данные из localStorage
          localStorage.removeItem('userData');
          localStorage.removeItem('userBalance');
          //alert('LocalStorage cleared'); // Debug alert
          // Перенаправляем на страницу входа
          window.location.href = '/auth/';
        } else {
          handleErrors(data.errors);
        }
      })
      .catch(error => {
        console.error('Ошибка при удалении профиля:', error);
      });
    } catch (error) {
      alert('Error during account deletion: ' + error.message); // Debug alert
    }
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
      alert(field+" "+messages);
    });
  }

  // Очистка форм при закрытии модальных окон
  $('.modal').on('hidden.bs.modal', function() {
    $(this).find('form')[0].reset();
    $(this).find('.is-invalid').removeClass('is-invalid');
    $(this).find('.invalid-feedback').text('');
  });

  //Вывод цены из корзины
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

    updateCartTotal();
}); 