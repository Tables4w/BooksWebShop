// Объединяем данные из обеих каруселей для удобства поиска в корзине
let allBooks = [];

// Функция добавления в корзину
function addToCart(bookId, title, price) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];
  
  //Находим книгу в объединённом массиве
  const book = allBooks.find(b => b.id === bookId);

  if (book) {
    const existingItem = cart.find(item => item.id === bookId);

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      cart.push({
        id: bookId,
        title: title,
        price: price,
        author: book.author,
        image: book.image,
        quantity: 1
      });
      selectedItems.push(cart.length - 1);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    updateCartTotal();
  }
}

// Вспомогательная функция для получения CSRF токена
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Функция обновления суммы в корзине
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

// Инициализация карусели и добавление книг
$(document).ready(function() {
  // Объединяем данные книг
  if (typeof books_new !== 'undefined') {
    allBooks = allBooks.concat(books_new);
  }
  if (typeof books_bs !== 'undefined') {
    allBooks = allBooks.concat(books_bs);
  }

  // Конфигурация Swiper
  const swiperConfig = {
    slidesPerView: 4,
    slidesPerGroup: 1,
    spaceBetween: 16,
    loop: true,
    speed: 800,
    autoplay: {
      delay: 2000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      1400: {
        slidesPerView: 4,
        slidesPerGroup: 1,
        spaceBetween: 16,
      },
      1200: {
        slidesPerView: 3,
        slidesPerGroup: 1,
        spaceBetween: 16,
      },
      992: {
        slidesPerView: 3,
        slidesPerGroup: 1,
        spaceBetween: 16,
      },
      768: {
        slidesPerView: 2,
        slidesPerGroup: 1,
        spaceBetween: 16,
      },
      576: {
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 16,
      }
    }
  };

  // Функция добавления книг в конкретную карусель
  function addBooksToSpecificCarousel(carouselId, booksArray) {
    const carousel = $(`#${carouselId} .swiper-wrapper`);
    booksArray.forEach(book => {
      const bookHtml = `
        <div class="swiper-slide">
          <a href="/book/${book.id}" class="text-decoration-none text-dark">
            <div class="card border-0 book-card">
              <img src="${book.image}" alt="${book.title}" class="book-cover card-img-top" />
              <div class="card-body p-2">
                <div class="book-title">${book.title}</div>
                <div class="book-price">${book.price} ₽</div>
                <button class="btn btn-sm btn-outline-primary mt-2 w-100 buy-btn" 
                        data-id="${book.id}" 
                        data-title="${book.title}" 
                        data-price="${book.price}">
                  Купить
                </button>
              </div>
            </div>
          </a>
        </div>
      `;
      carousel.append(bookHtml);
    });
  }

  // Добавление книг в карусель новинок
  if (typeof books_new !== 'undefined' && books_new.length > 0) {
    //console.log('New books array:', books_new);
    addBooksToSpecificCarousel('new-books-carousel', books_new);
  }

  // Добавление книг в карусель бестселлеров
  if (typeof books_bs !== 'undefined' && books_bs.length > 0) {
    //console.log('Bestsellers array:', books_bs);
    addBooksToSpecificCarousel('bestsellers-carousel', books_bs);
  }

  // Инициализируем карусели с автопрокруткой
  const newBooksSwiper = new Swiper('#new-books-carousel', swiperConfig);
  const bestsellersSwiper = new Swiper('#bestsellers-carousel', swiperConfig);

  // Запускаем автопрокрутку
  newBooksSwiper.autoplay.start();
  bestsellersSwiper.autoplay.start();

  // Обработчик кнопки "Купить"
  $(document).on('click', '.buy-btn', function(e) {
    e.preventDefault();
    const bookId = parseInt($(this).data('id'));
    const title = $(this).data('title');
    const price = parseInt($(this).data('price'));
    addToCart(bookId, title, price);
  });

  // Обновление суммы при загрузке страницы
  updateCartTotal();
});