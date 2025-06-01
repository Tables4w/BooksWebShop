      const booksGrid = document.getElementById('catalog-books');

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

      function displayBooks(bookArray) {
        booksGrid.innerHTML = ''; // Clear current books
        bookArray.forEach(book => {
          const bookCard = `
            <div class="col mb-4">
              <div class="card h-100">
                <img src="${book.image}" class="card-img-top" alt="${book.title}">
                <div class="card-body">
                  <h5 class="card-title">${book.title}</h5>
                  <p class="card-text">${book.author}</p>
                  <p class="card-text">${book.price}</p>
                  <a href="/my_admin/book/${book.id}/" class="btn btn-secondary">Редактировать</a>
                </div>
              </div>
            </div>
          `;
          booksGrid.innerHTML += bookCard;
        });
      }

      // Display the hardcoded books on page load
      displayBooks(books);