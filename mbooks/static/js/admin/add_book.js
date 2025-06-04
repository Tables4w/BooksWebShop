
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
        defaultOption.textContent = selectElementId === 'bookAuthor' ? 'Выберите автора' : 'Выберите издательство';
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
    console.log('Нажата кнопка выхода');

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

    // Handle form submission
    document.getElementById('addBookForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        formData.append('type', 'add_book'); // Параметр для определения типа запроса

        try {
            const response = await fetch('/my_admin/add_book/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                window.location.href = '/my_admin/catalog/';
            } else {
                alert(`Ошибка: ${data.message}`);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при добавлении книги');
        }
    });
});
