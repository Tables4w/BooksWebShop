
  // Static data for demonstration

  const staticData = {
    authors: ["Автор 1", "Автор 2", "Автор 3"],
    genres: ["Жанр 1", "Жанр 2", "Жанр 3"],
    publishers: ["Издательство 1", "Издательство 2"]
  };
  

  // Function to populate select options
  function populateSelect(selectElementId, dataArray) {
    const selectElement = document.getElementById(selectElementId);
    // Add a default option for single select
    if (selectElement.tagName === 'SELECT' && !selectElement.multiple) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите автора'; // or other default text
        selectElement.appendChild(defaultOption);
    }
    dataArray.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      selectElement.appendChild(option);
    });
  }

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

  // Populate the select lists on page load
  document.addEventListener('DOMContentLoaded', () => {
    populateSelect('bookAuthor', staticData.authors);
    populateSelect('bookGenre', staticData.genres);
    populateSelect('bookPublisher', staticData.publishers);


    const books={
    'id': '12',
    'title': 'boog',
    'description': 'desc',
    'year': '2000-01-01',
    'price': '100',
    'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAGUlEQVR42u3BMQEAAAgDoJvcF+NPKAAAAAAAAAAAABwG4UBAAEZH6RiAAAAAElFTkSuQmCC',
    'genre': ['Жанр 1', 'Жанр 2'],
    'author': ["Автор 1"],
    'publisher': ["Издательство 1"],
    }
    

  //Старые значения
  document.getElementById('bookTitle').value=books.title;
  document.getElementById('bookDescription').value=books.description;
  document.getElementById('bookPrice').value=books.price;
  document.getElementById('bookYear').value=books.year;
  document.getElementById('oldBookCover').src=books.image;

  function setSelectedOptions(selectId, selectedValues) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Убираем предыдущие выделения
    Array.from(select.options).forEach(option => {
      option.selected = selectedValues.includes(option.value);
    });
  }

  setSelectedOptions('bookAuthor', books.author);

  setSelectedOptions('bookGenre', books.genre);

  setSelectedOptions('bookPublisher', books.publisher);


    // Handle form submission
    document.getElementById('editBookForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      // You can add book ID to formData if needed, e.g., formData.append('book_id', bookId);

      try {
        // Replace '/api/edit-book/' with your actual backend endpoint for editing books
        const response = await fetch('/api/edit-book/', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          alert('Изменения сохранены!');
          // Optionally redirect or update UI
        } else {
          alert('Ошибка сохранения: ' + data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при сохранении изменений');
      }
    });

    // Handle delete button click
    document.getElementById('deleteBookBtn').addEventListener('click', async function() {
      if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
        const bookId = 1; // Replace with actual book ID
        try {
          // Replace '/api/delete-book/' with your actual backend endpoint for deleting books
          const response = await fetch(`/api/delete-book/${bookId}/`, {
            method: 'DELETE'
          });

          const data = await response.json();

          if (response.ok) {
            alert('Книга удалена!');
            // Redirect to admin catalog or update UI
            window.location.href = '/my_admin/catalog/';
          } else {
            alert('Ошибка удаления: ' + data.message);
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Произошла ошибка при удалении книги');
        }
      }
    });
  });
