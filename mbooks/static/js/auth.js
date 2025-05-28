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
    $('#login-form').submit(async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('type', 'login');
        formData.append('login', $('#login-email').val());
        formData.append('password', $('#login-password').val());

        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('userData', JSON.stringify(data));
                window.location.href = '/profile/';
            } else {
                alert('Неверный логин или пароль');
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            alert('Произошла ошибка при попытке входа');
        }
    });

    // Обработка формы регистрации
    $('#register-form').submit(async function(e) {
        e.preventDefault();

        // Проверка совпадения паролей
        if ($('#register-password').val() !== $('#register-password2').val()) {
            alert('Пароли не совпадают');
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

        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Регистрация успешна!');
                localStorage.setItem('userData', JSON.stringify(data));
                window.location.href = '/profile/';
            } else {
                const error = await response.json();
                alert('Ошибка регистрации: ' + (error.message || 'Проверьте введенные данные'));
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert('Произошла ошибка при попытке регистрации');
        }
    });
}); 