const booksGrid = document.getElementById('catalog-books');

// --- Вспомогательные функции для фильтров ---
function getUnique(arr, key) {
  return [...new Set(arr.flatMap(item => item[key]))].filter(Boolean);
}

// --- Рендер фильтров ---
function renderFilters() {
  // Жанры
  const genres = getUnique(books, 'genre');
  const genreContainer = document.getElementById('filter-genre');
  genreContainer.innerHTML = '';
  genres.forEach(genre => {
    genreContainer.innerHTML += `
      <div class="form-check">
        <input class="form-check-input genre-filter" type="checkbox" value="${genre}" id="genre-${genre}">
        <label class="form-check-label" for="genre-${genre}">${genre}</label>
      </div>
    `;
  });

  // Авторы
  const authors = getUnique(books, 'author');
  const authorContainer = document.getElementById('filter-author');
  authorContainer.innerHTML = '';
  authors.forEach(author => {
    authorContainer.innerHTML += `
      <div class="form-check">
        <input class="form-check-input author-filter" type="checkbox" value="${author}" id="author-${author}">
        <label class="form-check-label" for="author-${author}">${author}</label>
      </div>
    `;
  });

  // Годы
  const years = getUnique(books, 'year').sort((a, b) => a - b);
  const yearContainer = document.getElementById('filter-year');
  yearContainer.innerHTML = '';
  if (years.length) {
    yearContainer.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <input type="number" class="form-control form-control-sm year-filter" id="year-from" placeholder="от" min="${years[0]}" max="${years[years.length-1]}" style="width:70px;">
        <span>-</span>
        <input type="number" class="form-control form-control-sm year-filter" id="year-to" placeholder="до" min="${years[0]}" max="${years[years.length-1]}" style="width:70px;">
      </div>
    `;
  }
}

// --- Получение выбранных фильтров ---
function getSelectedFilters() {
  const selectedGenres = Array.from(document.querySelectorAll('.genre-filter:checked')).map(cb => cb.value);
  const selectedAuthors = Array.from(document.querySelectorAll('.author-filter:checked')).map(cb => cb.value);
  const yearFrom = parseInt(document.getElementById('year-from')?.value);
  const yearTo = parseInt(document.getElementById('year-to')?.value);
  return { selectedGenres, selectedAuthors, yearFrom, yearTo };
}

// --- Получение поискового запроса ---
function getSearchQuery() {
  return document.querySelector("input[type='search']")?.value.trim().toLowerCase() || '';
}

// --- Фильтрация книг ---
function filterBooks() {
  const { selectedGenres, selectedAuthors, yearFrom, yearTo } = getSelectedFilters();
  const search = getSearchQuery();
  
  return books.filter(book => {
    let genreOk = !selectedGenres.length || selectedGenres.every(g => book.genre.includes(g));
    let authorOk = !selectedAuthors.length || selectedAuthors.every(a => book.author.includes(a));
    let yearOk = true;
    if (!isNaN(yearFrom)) yearOk = book.year >= yearFrom;
    if (!isNaN(yearTo)) yearOk = yearOk && book.year <= yearTo;
    let searchOk = true;
    if (search) {
      searchOk = (book.title && book.title.toLowerCase().includes(search)) ||
                 (book.author && book.author.toLowerCase().includes(search));
    }
    return genreOk && authorOk && yearOk && searchOk;
  });
}

// --- Генерация карточек книг ---
function displayBooks(bookArray) {
  booksGrid.innerHTML = ''; // Clear current books
  if (!bookArray.length) {
    booksGrid.innerHTML = '<div class="text-muted text-center py-5">Нет книг по выбранным фильтрам</div>';
    return;
  }
  bookArray.forEach(book => {
    const bookCard = `
      <div class="col">
        <div class="card h-100">
          <img src="${book.image}" class="card-img-top" alt="${book.title}" style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${book.title}</h5>
            <p class="card-text">${book.author}</p>
            <p class="card-text">${book.price}</p>
            <a href="/my_admin/book/${book.id}/" class="btn btn-secondary mt-auto">Редактировать</a>
          </div>
        </div>
      </div>
    `;
    booksGrid.innerHTML += bookCard;
  });
}

// --- Обработчики событий ---
document.addEventListener('change', function(e) {
  if (e.target.matches('.genre-filter, .author-filter, .year-filter')) {
    displayBooks(filterBooks());
  }
});

document.addEventListener('input', function(e) {
  if (e.target.matches('#year-from, #year-to')) {
    displayBooks(filterBooks());
  }
});

document.addEventListener('input', function(e) {
  if (e.target.matches("input[type='search']")) {
    displayBooks(filterBooks());
  }
});

// --- Обработчик выхода ---
document.getElementById('admlogout').addEventListener('click', async function () {
  try {
    const response = await fetch('/my_admin/logout/', {
      method: 'POST',
    });

    if (response.ok) {
      localStorage.removeItem('userData');
      localStorage.removeItem('userBalance');
      window.location.href = '/auth/';
    } else {
      console.error('Ошибка выхода. Статус:', response.status);
      alert('Ошибка выхода. Попробуйте снова.');
    }
  } catch (error) {
    console.error('Ошибка при fetch logout:', error);
    alert('Произошла ошибка при выходе.');
  }
});

// --- Инициализация ---
renderFilters();
displayBooks(books);