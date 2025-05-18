$(document).ready(function() {
  const $loginForm = $('#login-form');
  const $registerForm = $('#register-form');
  const $toggle = $('#toggle-auth');
  const $title = $('#auth-title');
  const $welcomeText = $('#welcome-text');
  const $registerText = $('#register-text');

  $toggle.on('click', function(e) {
    e.preventDefault();
    if ($loginForm.is(':visible')) {
      $loginForm.hide();
      $registerForm.show();
      $title.text('Регистрация');
      $toggle.text('Войти');
       $welcomeText.hide();
      $registerText.show();
    } else {
      $registerForm.hide();
      $loginForm.show();
      $title.text('Вход');
      $toggle.text('Зарегистрироваться');
       $registerText.hide();
      $welcomeText.show();
    }
  });

  //При добавлении отправки формы с помощью fetch, используя метод POST (Защиту от CSRF можно не реализовывать)
  //Собрать поля формы в const formData = new FormData();
  //Например formData.append('<Имя поля>', <имя формы в коде>.<имя поля в html>.value);
  //Передавать параметры формы с именами и дополнительный параметр следующего вида:
  // formData.append('type', 'reg')  при регистрации
  // formData.append('type', 'login') при входе

  /*
    полный список параметров, ожидаемый на бекенде:
    Регистрация:
    'type'
    'login'
    'password'
    'gender'
    'fname'
    'lname'
    'email'
    'dob'

    Вход:
    'type'
    'login'
    'password'
  */

  //Словарь ошибок Errors вернётся с такими же названиями полей в качестве ключей
  //значениями будут строки, которые нужно выводить у соответсвующих полей

  //(В форме входа у Errors может быть доп. поле 'failedlog', появляющееся, если нет пользователя/пароля), содержащее строку с сообщением об этом
  //Соответственно, его нужно подставить для вывода ошибки
}); 
