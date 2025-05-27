$(document).ready(function() {
    // Проверяем, авторизован ли пользователь
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        window.location.href = '/profile/';
        return;
    }

    // Переключение между формами входа и регистрации
    $('#toggle-auth').click(function(e) {
        e.preventDefault();
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
    $('#login-form').submit(function(e) {
        e.preventDefault();
        
        const username = $('#login-email').val();
        const password = $('#login-password').val();

        // Проверка тестовых данных
        if (username === 'test' && password === 'test123') {
            // Сохраняем тестовые данные пользователя в localStorage
            const userData = {
                username: 'test',
                email: 'test@example.com',
                first_name: 'Тестовый',
                last_name: 'Пользователь',
                birth_date: '1990-01-01',
                gender: 'male',
                phone: '+7 (999) 123-45-67',
                address: 'г. Москва, ул. Примерная, д. 1'
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            alert('Успешный вход!');
            window.location.href = '/profile/';
        } else {
            alert('Неверный логин или пароль');
        }
    });

    // Обработка формы регистрации
    $('#register-form').submit(function(e) {
        e.preventDefault();

        // Проверка совпадения паролей
        if ($('#register-password').val() !== $('#register-password2').val()) {
            alert('Пароли не совпадают');
            return;
        }

        const registerData = {
            first_name: $('#register-name').val(),
            last_name: $('#register-surname').val(),
            birth_date: $('#register-date').val(),
            gender: $('#register-gender').val(),
            email: $('#register-email').val(),
            username: $('#register-login').val(),
            password: $('#register-password').val()
        };

        // Временная заглушка для тестирования
        console.log('Registration attempt:', registerData);
        alert('Регистрация успешна! Теперь вы можете войти.');
        $('#toggle-auth').click(); // Переключаемся на форму входа

        /* Закомментированный код для реальной отправки на бэкенд
        $.ajax({
            url: '/api/auth/register/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(registerData),
            success: function(response) {
                if (response.success) {
                    alert('Регистрация успешна! Теперь вы можете войти.');
                    $('#toggle-auth').click();
                } else {
                    alert('Ошибка регистрации: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('Ошибка регистрации. Пожалуйста, проверьте введенные данные.');
            }
        });
        */
    });
}); 