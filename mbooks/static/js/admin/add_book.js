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

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  formData.append('type', 'add_book');

  try {
    const response = await fetch('/my_admin/add_book/', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      window.location.replace('/my_admin/catalog/');
    }
  } catch (error) {
    //console.error('Error:', error);
    window.location.replace('/my_admin/catalog/');
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Populate select lists
  populateSelect('bookAuthor', staticData.authors);
  populateSelect('bookGenre', staticData.genres);
  populateSelect('bookPublisher', staticData.publishers);

  // Add event listeners
  document.getElementById('addBookForm').addEventListener('submit', handleFormSubmit);

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
        //console.error('Ошибка выхода. Статус:', response.status);
        window.location.href = '/auth/';
      }
    } catch (error) {
      //console.error('Ошибка при fetch logout:', error);
      window.location.href = '/auth/';
    }
  });
});
