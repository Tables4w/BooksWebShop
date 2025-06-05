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
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if(errorDiv) errorDiv.textContent = message;
    }

    // Функция для очистки ошибок
    function clearErrors() {
        $('.is-invalid').removeClass('is-invalid');
        $('.invalid-feedback').text('');
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
        clearErrors(); // Используем общую функцию очистки ошибок

        const formData = new FormData();
        formData.append('type', 'login');
        formData.append('login', $('#login-email').val());
        formData.append('password', $('#login-password').val());

        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            

            if (response.ok) {
                localStorage.setItem('userData', JSON.stringify(data));
                if(data.Success === 'logged as staff'){
                    console.log(data);
                    window.location.href = '/my_admin/orders/';
                } else {
                    window.location.href = '/profile/';
                }
            } else if (data.errors) {
                // Вывод ошибок валидации для каждого поля
                for (const [field, message] of Object.entries(data.errors)) {
                    const fieldId = field === 'login' ? 'login-email' : field === 'password' ? 'login-password' : field;
                     const input = document.getElementById(fieldId);
                     const errorDiv = document.getElementById(`${fieldId}-error`);
                     if (input) input.classList.add('is-invalid');
                     if (errorDiv) errorDiv.textContent = message;
                }
            } else {
                // Общая ошибка входа
                 const loginInput = document.getElementById('login-email');
                 const loginErrorDiv = document.getElementById('login-email-error');
                 if(loginInput) loginInput.classList.add('is-invalid');
                 if(loginErrorDiv) loginErrorDiv.textContent = 'Неверный логин или пароль';

                 const passwordInput = document.getElementById('login-password');
                 const passwordErrorDiv = document.getElementById('login-password-error');
                 if(passwordInput) passwordInput.classList.add('is-invalid');
                 if(passwordErrorDiv) passwordErrorDiv.textContent = 'Неверный логин или пароль';
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            // Можно добавить вывод общей ошибки в отдельный div, если нужно
        }
    });

    // Обработка формы регистрации
    $('#register-form').submit(async function(e) {
        e.preventDefault();
        console.log('Регистрация: форма отправляется');

        // Очищаем старые ошибки
        ['name', 'surname', 'date', 'gender', 'email', 'login', 'password', 'password2'].forEach(field => {
            const input = document.getElementById(`register-${field}`);
            const errorDiv = document.getElementById(`register-${field}-error`);
            if (input) input.classList.remove('is-invalid');
            if (errorDiv) errorDiv.textContent = '';
        });

        const formData = new FormData();
        formData.append('fname', document.getElementById('register-name').value);
        formData.append('lname', document.getElementById('register-surname').value);
        
        // Форматируем дату перед отправкой
        const dateInput = document.getElementById('register-date').value;
        let formattedDate = '';
        if (dateInput) {
            try {
                const date = new Date(dateInput);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = ('0' + (date.getMonth() + 1)).slice(-2);
                    const day = ('0' + date.getDate()).slice(-2);
                    formattedDate = `${year}-${month}-${day}`;
                } else {
                    console.warn('Регистрация: Невалидная дата в поле.');
                }
            } catch (error) {
                console.error('Регистрация: Ошибка форматирования даты:', error);
            }
        }
        formData.append('dob', formattedDate);

        formData.append('gender', document.getElementById('register-gender').value);
        formData.append('email', document.getElementById('register-email').value);
        formData.append('login', document.getElementById('register-login').value);
        formData.append('password', document.getElementById('register-password').value);
        formData.append('password2', document.getElementById('register-password2').value);
        formData.append('type', 'register');

        try {
            console.log('Регистрация: отправка данных формы:', Object.fromEntries(formData));
            
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            console.log('Регистрация: получен ответ, статус:', response.status, response.statusText);
            
            // Сначала получаем текст ответа для отладки
            const responseText = await response.text();
            console.log('Регистрация: текст ответа:', responseText);

            let errorData;
            try {
                errorData = JSON.parse(responseText);
                console.log('Регистрация: распарсенный JSON ответа:', errorData);
            } catch (jsonError) {
                console.error('Регистрация: ошибка парсинга JSON:', jsonError);
                alert('Ошибка обработки ответа сервера');
                return;
            }

            if (!response.ok) {
                console.warn('Регистрация: Ответ не OK', response.status);
                
                // Mapping backend field names to frontend field names
                const fieldMap = {
                    'fname': 'name',
                    'lname': 'surname',
                    'dob': 'date',
                    'paswd': 'password',
                    'non_field_errors': 'general'
                };

                // Проверяем различные форматы ответа с ошибками
                if (errorData) {
                    console.log('Регистрация: обработка ошибок валидации');
                    
                    // Если ошибки пришли в корне объекта
                    for (const [backendField, messages] of Object.entries(errorData)) {
                        const frontendField = fieldMap[backendField] || backendField;
                        
                        if (frontendField === 'general') {
                            console.error('Регистрация: Общая ошибка формы:', messages);
                            alert(Array.isArray(messages) ? messages.join(', ') : messages);
                            continue;
                        }

                        const input = document.getElementById(`register-${frontendField}`);
                        const errorDiv = document.getElementById(`register-${frontendField}-error`);

                        if (input && errorDiv) {
                            input.classList.add('is-invalid');
                            const errorMessage = Array.isArray(messages) ? messages.join(', ') : messages;
                            errorDiv.textContent = errorMessage;
                            console.log(`Регистрация: ошибка для поля ${frontendField}:`, errorMessage);
                        } else {
                            console.warn(`Регистрация: не найден элемент для поля ${backendField} (frontend: ${frontendField})`);
                        }
                    }
                } else {
                    console.error('Регистрация: неожиданный формат ответа с ошибкой:', errorData);
                    alert('Произошла ошибка при регистрации');
                }
            } else {
                console.log('Регистрация: успешный ответ', errorData);
                localStorage.setItem('userData', JSON.stringify(errorData));
                window.location.href = '/profile/';
            }
        } catch (error) {
            console.error('Регистрация: ошибка запроса:', error);
            alert('Произошла сетевая ошибка при регистрации');
        }
    });

    // Очистка ошибок при вводе
    $('input').on('input', function() {
        $(this).removeClass('is-invalid');
        const fieldId = this.id;
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if(errorDiv) errorDiv.textContent = '';
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