// Function to fetch tags from backend
async function fetchTags() {
    try {
        const formData = new FormData();
        formData.append('formtype', 'get');
        
        const response = await fetch('/my_admin/edit_tags/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            body: formData
        });
        
        if (!response.ok) {
            //console.error('Server response:', response.status, response.statusText);
            const errorText = await response.text();
            //console.error('Error response:', errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        //console.log('Fetched tags from server:', data);
        return data;
    } catch (error) {
        //console.error('Error fetching tags:', error);
        return null;
    }
}

// Function to populate lists with animation
function populateList(listElementClass, dataArray) {
    //console.log(`Populating ${listElementClass} with:`, dataArray);
    
    // Преобразуем имя класса для издательств
    const actualListClass = listElementClass === 'publishers-list' ? 'publisher-list' : listElementClass;
    const listElement = document.querySelector(`ul.list-group.${actualListClass}`);
    if (!listElement) {
        //console.error(`List element with class ${actualListClass} not found`);
        return;
    }

    if (!Array.isArray(dataArray)) {
        //console.error(`Invalid data array for ${actualListClass}:`, dataArray);
        return;
    }

    //console.log(`Found ${dataArray.length} items to populate in ${actualListClass}`);

    // Анимация удаления старых элементов
    const currentItems = Array.from(listElement.children);
    //console.log(`Removing ${currentItems.length} current items from ${actualListClass}`);
    currentItems.forEach(item => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => item.remove(), 300);
    });

    // Добавление новых элементов с анимацией
    setTimeout(() => {
        listElement.innerHTML = ''; // Clear current list
        //console.log(`Adding ${dataArray.length} new items to ${actualListClass}`);
        dataArray.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            listItem.style.opacity = '0';
            listItem.style.transform = 'translateX(-20px)';
            listItem.style.transition = 'all 0.3s ease';
            
            listItem.textContent = item;
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'delete-tag-btn');
            deleteButton.textContent = 'Удалить';
            deleteButton.dataset.tagType = listElementClass === 'publishers-list' ? 'publishers' : listElementClass.replace('-list', 's');
            deleteButton.dataset.tagValue = item;

            //console.log(`Created delete button for ${item} with tagType=${deleteButton.dataset.tagType}`);

            listItem.appendChild(deleteButton);
            listElement.appendChild(listItem);

            // Анимация появления
            setTimeout(() => {
                listItem.style.opacity = '1';
                listItem.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }, 300);
}

// Function to update all lists
async function updateAllLists() {
    //console.log('Updating all lists...');
    
    // Используем текущие теги
    if (tags && typeof tags === 'object') {
        //console.log('Using current tags:', tags);
        //console.log('Authors array:', tags.authors);
        //console.log('Genres array:', tags.genres);
        //console.log('Publishers array:', tags.publishers);
        
        populateList('author-list', tags.authors || []);
        populateList('genre-list', tags.genres || []);
        populateList('publisher-list', tags.publishers || []);
    } else {
        //console.error('No tags data available');
    }
}

// Function to add new tag
async function addTag(tagType, tagValue) {
    //console.log('Starting addTag function:', { tagType, tagValue });
    
    if (!tagType || !tagValue) {
        //console.error('Tag type and value are required');
        return false;
    }

    // Валидация ввода
    tagValue = tagValue.trim();
    //console.log('Trimmed tag value:', tagValue);
    
    if (tagValue.length < 2) {
        alert('Тег должен содержать минимум 2 символа');
        return false;
    }

    if (tagValue.length > 50) {
        alert('Тег не должен превышать 50 символов');
        return false;
    }

    // Проверка на специальные символы
    const specialChars = /[<>{}[\]\\]/;
    if (specialChars.test(tagValue)) {
        alert('Тег не должен содержать специальные символы: < > { } [ ] \\');
        return false;
    }

    // Проверка на дубликаты только в текущем списке
    //console.log('Checking for duplicates in:', tagType);
    ////console.log('Current tags object:', tags);
    if (tags && typeof tags === 'object') {
        const tagArray = tags[tagType] || [];
        ////console.log('Current tag array:', tagArray);
        const isDuplicate = tagArray.some(tag => tag.toLowerCase() === tagValue.toLowerCase());
        ////console.log('Is duplicate:', isDuplicate);
        if (isDuplicate) {
            alert('Такой тег уже существует в этом списке');
            return false;
        }
    }

    //console.log(`Adding new tag: type=${tagType}, value=${tagValue}`);
    const formData = new FormData();
    formData.append('formtype', 'add')
    formData.append('type', tagType);
    formData.append('value', tagValue);

    try {
        //console.log('Sending request to server...');
        const response = await fetch('/my_admin/edit_tags/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            body: formData
        });

        //console.log('Server response status:', response.status);
        const responseText = await response.text();
        //console.log('Server response text:', responseText);

        if (!response.ok) {
            //console.error('Server response:', response.status, response.statusText);
            //console.error('Error response:', responseText);
            throw new Error(`Server returned ${response.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        //console.log('Add tag response:', data);
        
        if (data.success) {
            //console.log('Tag added successfully, updating lists...');
            // Обновляем локальный объект tags
            if (tags && typeof tags === 'object') {
                const tagArray = tags[tagType] || [];
                tagArray.push(tagValue);
                tags[tagType] = tagArray;
                //console.log('Updated tags object:', tags);
            }
            // Обновляем только текущий список
            const listElementClass = tagType === 'publishers' ? 'publisher-list' : tagType.replace('s', '') + '-list'; // genres -> genre-list
            //console.log('Looking for list element with class:', listElementClass);
            const listElement = document.querySelector(`ul.list-group.${listElementClass}`);
            //console.log('Found list element:', listElement);
            
            if (listElement) {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.style.opacity = '0';
                listItem.style.transform = 'translateX(-20px)';
                listItem.style.transition = 'all 0.3s ease';
                
                listItem.textContent = tagValue;
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'delete-tag-btn');
                deleteButton.textContent = 'Удалить';
                deleteButton.dataset.tagType = tagType;
                deleteButton.dataset.tagValue = tagValue;

                listItem.appendChild(deleteButton);
                listElement.appendChild(listItem);
                //console.log('Added new list item to DOM');

                // Анимация появления
                setTimeout(() => {
                    //console.log('Starting appearance animation');
                    listItem.style.opacity = '1';
                    listItem.style.transform = 'translateX(0)';
                }, 50);
            } else {
                //console.error('List element not found with class:', listElementClass);
            }
            return true;
        } else {
            throw new Error(data.error || 'Failed to add tag');
        }
    } catch (error) {
        //console.error('Error adding tag:', error);
        alert('Ошибка при добавлении тега: ' + error.message);
        return false;
    }
}

// Function to delete tag
async function deleteTag(tagType, tagValue) {
    //console.log('Starting deleteTag function:', { tagType, tagValue });
    
    if (!tagType || !tagValue) {
        //console.error('Tag type and value are required');
        return false;
    }

    // Находим элемент списка, который нужно удалить
    const listElementClass = tagType === 'publishers' ? 'publisher-list' : tagType.replace('s', '') + '-list';
    //console.log('Looking for list element with class:', listElementClass);
    const listElement = document.querySelector(`ul.list-group.${listElementClass}`);
    //console.log('Found list element:', listElement);
    
    let itemToRemove = null;
    if (listElement) {
        const items = listElement.querySelectorAll('.list-group-item');
        //console.log('Found list items:', items.length);
        
        for (const item of items) {
            const itemText = item.textContent.replace('Удалить', '').trim();
            //console.log('Checking item:', itemText, 'against:', tagValue);
            if (itemText === tagValue) {
                //console.log('Found matching item, preparing for removal');
                itemToRemove = item;
                // Анимация удаления
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                break;
            }
        }
    }

    // Обновляем локальный объект tags
    //console.log('Current tags object:', tags);
    if (tags && typeof tags === 'object') {
        const tagArray = tags[tagType] || [];
        //console.log('Current tag array:', tagArray);
        const index = tagArray.findIndex(tag => tag === tagValue);
        //console.log('Found tag at index:', index);
        
        if (index > -1) {
            tagArray.splice(index, 1);
            tags[tagType] = tagArray;
            //console.log(`Removed ${tagValue} from ${tagType}, new array:`, tagArray);
        }
    }

    // Отправляем запрос на сервер
    const serverTagType = tagType === 'publishers' ? 'publisher' : tagType.replace('s', '');
    //console.log(`Sending delete request: type=${serverTagType}, value=${tagValue}`);
    
    const formData = new FormData();
    formData.append('formtype', 'del')
    formData.append('type', serverTagType);
    formData.append('value', tagValue);

    try {
        // Ждем завершения анимации перед отправкой запроса
        if (itemToRemove) {
            await new Promise(resolve => setTimeout(resolve, 300));
            itemToRemove.remove();
        }

        //console.log('Sending request to server...');
        const response = await fetch('/my_admin/edit_tags/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            body: formData
        });

        //console.log('Server response status:', response.status);
        const responseText = await response.text();
        //console.log('Server response text:', responseText);

        // Проверяем успешность ответа
        if (response.ok) {
            //console.log('Tag successfully deleted from server');
            return true;
        }

        //console.error('Server response:', response.status, response.statusText);
        //console.error('Error response:', responseText);
        // В случае ошибки возвращаем тег обратно
        if (tags && typeof tags === 'object') {
            const tagArray = tags[tagType] || [];
            tagArray.push(tagValue);
            tags[tagType] = tagArray;
            // Возвращаем элемент в DOM
            if (listElement) {
                //console.log('Restoring tag to DOM');
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.textContent = tagValue;
                
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'delete-tag-btn');
                deleteButton.textContent = 'Удалить';
                deleteButton.dataset.tagType = tagType;
                deleteButton.dataset.tagValue = tagValue;
                
                listItem.appendChild(deleteButton);
                listElement.appendChild(listItem);
            }
        }
        throw new Error(`Server returned ${response.status}: ${responseText}`);
    } catch (error) {
        //console.error('Error deleting tag:', error);
        alert('Ошибка при удалении тега: ' + error.message);
        return false;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        //console.log('Initializing page...');
        // Проверяем наличие необходимых элементов
        const authorList = document.querySelector('ul.list-group.author-list');
        const genreList = document.querySelector('ul.list-group.genre-list');
        const publisherList = document.querySelector('ul.list-group.publisher-list');

        if (!authorList || !genreList || !publisherList) {
            throw new Error('Required list elements not found');
        }

        // Отображаем начальные теги
        if (tags && typeof tags === 'object') {
            //console.log('Initial tags:', tags);
            //console.log('Authors:', tags.authors);
            //console.log('Genres:', tags.genres);
            //console.log('Publishers:', tags.publishers);
            
            populateList('author-list', tags.authors || []);
            populateList('genre-list', tags.genres || []);
            populateList('publisher-list', tags.publishers || []);
        } else {
            throw new Error('Initial tags data is missing or invalid');
        }

        // Add event listeners for add buttons
        document.querySelectorAll('.add-tag-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const input = e.target.previousElementSibling;
                if (!input) {
                    //console.error('Input element not found');
                    return;
                }

                const newItem = input.value.trim();
                const tagType = e.target.dataset.tagType;

                if (newItem && tagType) {
                    //console.log(`Add button clicked: type=${tagType}, value=${newItem}`);
                    const success = await addTag(tagType, newItem);
                    if (success) {
                        input.value = '';
                    }
                }
            });

            // Добавляем обработчик Enter для поля ввода
            const input = button.previousElementSibling;
            if (input) {
                input.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const newItem = input.value.trim();
                        const tagType = button.dataset.tagType;

                        if (newItem && tagType) {
                            //console.log(`Enter pressed: type=${tagType}, value=${newItem}`);
                            const success = await addTag(tagType, newItem);
                            if (success) {
                                input.value = '';
                            }
                        }
                    }
                });
            }
        });

        // Add event listeners for delete buttons using event delegation
        document.querySelectorAll('.list-group').forEach(list => {
            list.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-tag-btn')) {
                    const button = e.target;
                    const itemText = button.dataset.tagValue;
                    const tagType = button.dataset.tagType;

                    if (itemText && tagType) {
                        //console.log(`Delete button clicked: type=${tagType}, value=${itemText}`);
                        await deleteTag(tagType, itemText);
                    }
                }
            });
        });

        // Обработчик выхода
        const logoutButton = document.getElementById('admlogout');
        if (logoutButton) {
            logoutButton.addEventListener('click', async function () {
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
                        alert('Ошибка выхода. Попробуйте снова.');
                    }
                } catch (error) {
                    //console.error('Ошибка при fetch logout:', error);
                    alert('Произошла ошибка при выходе.');
                }
            });
        }
    } catch (error) {
        //console.error('Error initializing page:', error);
        alert('Ошибка при инициализации страницы: ' + error.message);
    }
});