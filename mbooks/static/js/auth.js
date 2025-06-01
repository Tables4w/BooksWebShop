$(document).ready(function() {
    // Проверяем, авторизован ли пользователь
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        window.location.href = '/profile/';
        return;
    }

    // Функция для отображения ошибок
    function showError(fieldId, message) {
        const field = $(`#${fieldId}`);
        field.addClass('is-invalid');
        // Удаляем предыдущее сообщение об ошибке, если оно есть
        field.next('.invalid-feedback').remove();
        // Добавляем новое сообщение об ошибке
        field.after(`<div class="invalid-feedback">${message}</div>`);
    }

    // Функция для очистки ошибок
    function clearErrors() {
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').remove();
    }

    // Переключение между формами входа и регистрации
    $('#toggle-auth').click(function(e) {
        e.preventDefault();
        clearErrors(); // Очищаем ошибки при переключении форм
        const loginForm = $('#login-form');
        const registerForm = $('#register-form');
        const authTitle = $('#auth-title');
        const registerText = $('#register-text');
        const welcomeText = $('#welcome-text');
        const toggleLink = $(this);

        if (loginForm.is(':visible')) {
            loginForm.hide();
            registerForm.show();
            authTitle.text('Регистрация');
            registerText.show();
            welcomeText.hide();
            toggleLink.text('Войти');
        } else {
            loginForm.show();
            registerForm.hide();
            authTitle.text('Вход');
            registerText.hide();
            welcomeText.show();
            toggleLink.text('Зарегистрироваться');
        }
    });

    // Обработка формы входа
    $('#login-form').submit(async function(e) {
        e.preventDefault();
        clearErrors(); // Очищаем предыдущие ошибки
        
        const formData = new FormData();
        formData.append('type', 'login');
        formData.append('login', $('#login-email').val());
        formData.append('password', $('#login-password').val());

        // Отладочная информация
        /*
        alert('Отправка формы входа:\n' + 
              'Логин: ' + $('#login-email').val() + '\n' +
              'Пароль: ' + $('#login-password').val());
        */

        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            JSON.stringify(data);

            if (response.ok) {
                localStorage.setItem('userData', JSON.stringify(data));
                if(data.Success='logged as staff'){
                    console.log(data)
                    window.location.href = '/my_admin/orders/';
                } else
                    window.location.href = '/profile/';
            } else {
                if (data.errors) {
                    // Вывод ошибок валидации для каждого поля
                    Object.entries(data.errors).forEach(([field, messages]) => {
                        const fieldId = field === 'login' ? 'login-email' : field;
                        showError(fieldId, messages.join(', '));
                    });
                } else {
                    showError('login-email', 'Неверный логин или пароль');
                    showError('login-password', 'Неверный логин или пароль');
                }
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            alert('Произошла ошибка при попытке входа: ' + error.message);
        }
    });

    // Обработка формы регистрации
    $('#register-form').submit(async function(e) {
        e.preventDefault();
        clearErrors(); // Очищаем предыдущие ошибки

        // Проверка совпадения паролей
        if ($('#register-password').val() !== $('#register-password2').val()) {
            showError('register-password2', 'Пароли не совпадают');
            return;
        }

        const formData = new FormData();
        formData.append('type', 'register');
        formData.append('login', $('#register-login').val());
        formData.append('password', $('#register-password').val());
        formData.append('gender', $('#register-gender').val());
        formData.append('fname', $('#register-name').val());
        formData.append('lname', $('#register-surname').val());
        formData.append('email', $('#register-email').val());
        formData.append('dob', $('#register-date').val());

        // Отладочная информация
        /*
        alert('Отправка формы регистрации:\n' + 
              'Логин: ' + $('#register-login').val() + '\n' +
              'Email: ' + $('#register-email').val() + '\n' +
              'Имя: ' + $('#register-name').val() + '\n' +
              'Фамилия: ' + $('#register-surname').val() + '\n' +
              'Пол: ' + $('#register-gender').val() + '\n' +
              'Дата рождения: ' + $('#register-date').val());
        */

        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            //alert('Ответ сервера: ' + JSON.stringify(data, null, 2));

            if (response.ok) {
                //alert('Регистрация успешна!');
                localStorage.setItem('userData', JSON.stringify(data));
                window.location.href = '/profile/';
            } else {
                if (data.errors) {
                    // Вывод ошибок валидации для каждого поля
                    Object.entries(data.errors).forEach(([field, messages]) => {
                        const fieldId = field === 'login' ? 'register-login' : 
                                      field === 'password' ? 'register-password' :
                                      field === 'fname' ? 'register-name' :
                                      field === 'lname' ? 'register-surname' :
                                      field === 'email' ? 'register-email' :
                                      field === 'dob' ? 'register-date' :
                                      `register-${field}`;
                        showError(fieldId, messages.join(', '));
                    });
                } else {
                    alert('Ошибка регистрации: ' + (data.message || 'Проверьте введенные данные'));
                }
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert('Произошла ошибка при попытке регистрации: ' + error.message);
        }
    });

    // Очистка ошибок при вводе
    $('input').on('input', function() {
        $(this).removeClass('is-invalid');
        $(this).next('.invalid-feedback').remove();
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