  // Static data for demonstration





  // Function to populate select options
  function populateSelect(selectElementId, dataArray) {
    const selectElement = document.getElementById(selectElementId);
    if (selectElement.tagName === 'SELECT' && !selectElement.multiple) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Выберите автора';
      selectElement.appendChild(defaultOption);
    }
    dataArray.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      selectElement.appendChild(option);
    });
  }

  function setSelectedOptions(selectId, selectedValues) {
    const select = document.getElementById(selectId);
    if (!select) return;

    Array.from(select.options).forEach(option => {
      option.selected = selectedValues.includes(option.value);
    });
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    const bookId = books.id;
    const formData = new FormData(e.target);
    formData.append('formtype', 'edit');

    try {
      const response = await fetch(`/my_admin/book/${bookId}/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        window.location.replace('/my_admin/catalog/');
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.replace('/my_admin/catalog/');
    }
  }

  // Handle delete button click
  async function handleDeleteClick() {
    const bookId = books.id;
    const formData = new FormData();
    formData.append('formtype', 'delete');

    if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
      try {
        const response = await fetch(`/my_admin/book/${bookId}/`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          window.location.replace('/my_admin/catalog/');
        }
      } catch (error) {
        console.error('Error:', error);
        window.location.replace('/my_admin/catalog/');
      }
    }
  }

  // Initialize the page
  document.addEventListener('DOMContentLoaded', () => {
    // Populate select lists
    populateSelect('bookAuthor', staticData.authors);
    populateSelect('bookGenre', staticData.genres);
    populateSelect('bookPublisher', staticData.publishers);

    // Set initial values
    document.getElementById('bookTitle').value = books.title;
    document.getElementById('bookDescription').value = books.description;
    document.getElementById('bookPrice').value = books.price;
    document.getElementById('bookYear').value = books.year;
    document.getElementById('oldBookCover').src = books.image;

    // Set selected options
    setSelectedOptions('bookAuthor', books.author);
    setSelectedOptions('bookGenre', books.genre);
    setSelectedOptions('bookPublisher', books.publisher);

    // Add event listeners
    document.getElementById('editBookForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('deleteBookBtn').addEventListener('click', handleDeleteClick);

    // Handle logout
    document.getElementById('admlogout').addEventListener('click', async function() {
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
          window.location.href = '/auth/';
        }
      } catch (error) {
        console.error('Ошибка при fetch logout:', error);
        window.location.href = '/auth/';
      }
    });
  });
