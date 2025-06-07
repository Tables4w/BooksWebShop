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
  //console.log('Logout button found:', logoutBtn.length > 0); // Debug log

  if (logoutBtn.length > 0) {
    logoutBtn.on('click', function(e) {
      ////console.log('Logout button clicked'); // Debug log
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
            //console.error('Ошибка при выходе:', error);
          });
      } catch (error) {
        alert('Error during logout: ' + error.message); // Debug alert
      }
    });
  } else {
    //console.error('Logout button not found in DOM'); // Debug log
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
      //console.error('Ошибка при получении данных профиля:', error);
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

  //console.log('Fetching user orders from /getuserorders/'); // Лог перед запросом

  fetch('/getuserorders/')
    .then(response => {
      //console.log('Received response for user orders', response.status); // Лог статуса ответа
      if (!response.ok) {
        //console.error('Ошибка HTTP при получении заказов:', response.status, response.statusText); // Лог ошибки HTTP
        throw new Error('Ошибка при получении заказов: ' + response.statusText);
      }
      return response.json();
    })
    .then(orders => {
      //console.log('User orders data received:', orders); // Лог полученных данных

      if (orders.length === 0) {
        currentOrdersList.html('<div class="alert alert-info">У вас пока нет текущих заказов.</div>');
        completedOrdersList.html('<div class="alert alert-info">У вас пока нет завершенных заказов.</div>');
        //console.log('No user orders found.'); // Лог пустого списка
        return;
      }

      orders.forEach((order, index) => {
        const orderHtml = createOrderCard(order, order.id);
        //console.log('Processing order:', order.id, 'status:', order.status); // Лог обработки каждого заказа
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
      //console.log('User orders display updated.'); // Лог завершения отображения
    })
    .catch(error => {
      //console.error('Ошибка загрузки пользовательских заказов:', error); // Лог ошибки в catch
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
    //console.log('Form submitted'); // Debug log
    
    // Очищаем предыдущие ошибки
    $(this).find('.is-invalid').removeClass('is-invalid');
    $(this).find('.invalid-feedback').text('');

    // Получаем значения полей по placeholder
    const cardNumInput = $(this).find('input[name="cardNum"]');
    const dateInput = $(this).find('input[name="date"]');
    const cvvInput = $(this).find('input[name="cvv"]');
    const sumInput = $(this).find('input[name="summ"]');

    const cardNum = cardNumInput.val();
    const date = dateInput.val();
    const cvv = cvvInput.val();
    const sum = parseInt(sumInput.val());

    //console.log('Form data:', { cardNum, date, cvv, sum }); // Debug log

    let hasErrors = false;

    // Клиентская валидация
    if (!cardNum) {
      cardNumInput.addClass('is-invalid');
      cardNumInput.next('.invalid-feedback').text('Пожалуйста, заполните номер карты.');
      hasErrors = true;
    }

    if (!date) {
      dateInput.addClass('is-invalid');
      dateInput.next('.invalid-feedback').text('Пожалуйста, заполните срок действия.');
      hasErrors = true;
    }

    if (!cvv) {
      cvvInput.addClass('is-invalid');
      cvvInput.next('.invalid-feedback').text('Пожалуйста, заполните CVV.');
      hasErrors = true;
    }

    if (isNaN(sum) || sum <= 0) {
        sumInput.addClass('is-invalid');
        sumInput.closest('.input-group').next('.invalid-feedback').text('Сумма пополнения должна быть больше 0');
        hasErrors = true;
    }

    if (cardNum.replace(/\s/g, '').length !== 16) {
      cardNumInput.addClass('is-invalid');
      cardNumInput.next('.invalid-feedback').text('Номер карты должен содержать 16 цифр.');
      hasErrors = true;
    }

    if (hasErrors) {
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
        // alert('Баланс успешно пополнен'); // Убираем алерт при успешном пополнении
      } else {
        // Используем handleErrors для отображения ошибок с сервера
        handleErrors(data.errors);
        // alert('Ошибка при пополнении'); // Убираем общий алерт при ошибке
      }
    })
    .catch(error => {
      //console.error('Ошибка при пополнении', error);
      // alert('Произошла ошибка при пополнении'); // Убираем алерт для сетевых ошибок
      // Можно добавить вывод общей ошибки в отдельный div, если нужно
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
    //console.log('Input event on date field'); // Добавлен лог
    let value = $(this).val().replace(/\D/g, '');
    if(value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    $(this).val(value);
    // Убедимся, что здесь нет алертов
  });

  // Только цифры для CVV
  $('#balanceForm input[placeholder="000"]').on('input', function() {
    //console.log('Input event on CVV field'); // Добавлен лог
    $(this).val($(this).val().replace(/\D/g, ''));
    // Убедимся, что здесь нет алертов
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
      //console.error('Ошибка при обновлении профиля:', error);
      alert('Произошла ошибка при обновлении данных');
    });
  });

  // Смена email
  $('#saveEmailBtn').on('click', function() {
    const newEmail = $('#newEmail').val();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Очищаем предыдущие ошибки
    $('#newEmail').removeClass('is-invalid');
    $('#newEmail').next('.invalid-feedback').text('');

    // Валидация email
    if (!emailRegex.test(newEmail)) {
      $('#newEmail').addClass('is-invalid');
      $('#newEmail').next('.invalid-feedback').text('Пожалуйста, введите корректный email адрес');
      return;
    }

    const formData = new FormData();
    formData.append('type', 'change_email');
    formData.append('new_email', newEmail);

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        $('#emailModal').modal('hide');
        //console.log('Email успешно изменен!');
        userData.email = formData.get('new_email');
        localStorage.setItem('userData', JSON.stringify(userData));
        $('#profile-email').text(userData.email);
      } else {
        handleErrors(data.errors);
      }
    })
    .catch(error => {
      //console.error('Ошибка при смене email:', error);
      $('#newEmail').addClass('is-invalid');
      $('#newEmail').next('.invalid-feedback').text('Произошла ошибка при смене email');
    });
  });

  // Смена пароля
  $('#savePasswordBtn').click(function() {
    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();
    
    // Очищаем предыдущие ошибки
    $('.password-field').removeClass('is-invalid');
    $('.password-field').next('.invalid-feedback').text('');

    let hasErrors = false;

    // Валидация текущего пароля
    if (!currentPassword) {
      $('#currentPassword').addClass('is-invalid');
      $('#currentPassword').next('.invalid-feedback').text('Введите текущий пароль');
      hasErrors = true;
    }

    // Валидация нового пароля
    if (newPassword.length < 8) {
      $('#newPassword').addClass('is-invalid');
      $('#newPassword').next('.invalid-feedback').text('Пароль должен содержать минимум 8 символов');
      hasErrors = true;
    }

    // Проверка совпадения паролей
    if (newPassword !== confirmPassword) {
      $('#confirmPassword').addClass('is-invalid');
      $('#confirmPassword').next('.invalid-feedback').text('Пароли не совпадают');
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    const formData = new FormData();
    formData.append('type', 'change_password');
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    formData.append('confirm_password', confirmPassword);

    fetch('/profile/', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        $('#passwordModal').modal('hide');
        //console.log('Пароль успешно изменен!');
        $('#passwordChangeForm')[0].reset();
      } else {
        // Проверяем наличие ошибки о неверном текущем пароле
        if (data.errors && data.errors.current_password) {
          $('#currentPassword').addClass('is-invalid');
          $('#currentPassword').next('.invalid-feedback').text('Неверный текущий пароль');
        } else {
          handleErrors(data.errors);
        }
      }
    })
    .catch(error => {
      //console.error('Ошибка при смене пароля:', error);
      $('.password-field').addClass('is-invalid');
      $('.password-field').next('.invalid-feedback').text('Произошла ошибка при смене пароля');
    });
  });

  // Добавляем класс password-field ко всем полям пароля
  $('#currentPassword, #newPassword, #confirmPassword').addClass('password-field');

  // Реальная валидация email при вводе
  $('#newEmail').on('input', function() {
    const email = $(this).val();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    $(this).removeClass('is-invalid');
    $(this).next('.invalid-feedback').text('');

    if (email && !emailRegex.test(email)) {
      $(this).addClass('is-invalid');
      $(this).next('.invalid-feedback').text('Пожалуйста, введите корректный email адрес');
    }
  });

  // Реальная валидация пароля при вводе
  $('#newPassword').on('input', function() {
    const password = $(this).val();
    
    $(this).removeClass('is-invalid');
    $(this).next('.invalid-feedback').text('');

    if (password && password.length < 8) {
      $(this).addClass('is-invalid');
      $(this).next('.invalid-feedback').text('Пароль должен содержать минимум 8 символов');
    }
  });

  // Реальная проверка совпадения паролей
  $('#confirmPassword').on('input', function() {
    const confirmPassword = $(this).val();
    const newPassword = $('#newPassword').val();
    
    $(this).removeClass('is-invalid');
    $(this).next('.invalid-feedback').text('');

    if (confirmPassword && confirmPassword !== newPassword) {
      $(this).addClass('is-invalid');
      $(this).next('.invalid-feedback').text('Пароли не совпадают');
    }
  });

  // Удаление аккаунта
  $('#confirmDeleteBtn').on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    //console.log('Confirm delete button clicked'); // Добавил лог
    
    const formData = new FormData();
    formData.append('type', 'delete_account');

    fetch('/profile/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Очищаем данные пользователя из localStorage
            localStorage.removeItem('userData');
            localStorage.removeItem('userBalance');
            // Закрываем модальное окно
            $('#deleteAccountModal').modal('hide');
            // Перенаправляем на страницу входа
            window.location.href = '/auth/';
        } else {
            // handleErrors(data.errors); // Оставил обработку ошибок через alert, как было ранее, чтобы не потерять функционал
            //console.error('Server returned an error:', data.errors); // Добавил лог ошибок с сервера
            alert('Ошибка при удалении аккаунта: ' + JSON.stringify(data.errors)); // Показываем ошибки с сервера
        }
    })
    .catch(error => {
        //console.error('Ошибка при удалении профиля:', error);
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
      // Отображаем первое сообщение об ошибке для поля
      if (Array.isArray(messages) && messages.length > 0) {
        input.next('.invalid-feedback').text(messages[0]);
      } else if (typeof messages === 'string') {
         input.next('.invalid-feedback').text(messages);
      } else {
         //console.error('Неожиданный формат сообщения об ошибке для поля', field, messages); // Логируем неожиданный формат
      }
      // alert(field+" "+messages); // Удаляем алерт здесь
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