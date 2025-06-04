
// Function to fetch tags from backend
/*
async function fetchTags() {
    try {
        const response = await fetch('/my_admin/get_tags/');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tags:', error);
        return {
            authors: [],
            genres: [],
            publishers: []
        };
    }
}
*/

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

// Function to populate lists
function populateList(listElementClass, dataArray) {
    const listElement = document.querySelector(`ul.list-group.${listElementClass}`);
    listElement.innerHTML = ''; // Clear current list
    dataArray.forEach(item => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.textContent = item;
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'delete-tag-btn');
        deleteButton.textContent = 'Удалить';
        deleteButton.dataset.tagType = listElementClass.replace('-list', '');
        deleteButton.dataset.tagValue = item;

        listItem.appendChild(deleteButton);
        listElement.appendChild(listItem);
    });
}

// Function to add new tag
async function addTag(tagType, tagValue) {
    const formData = new FormData();
    formData.append('formtype', 'add')
    formData.append('type', tagType);
    formData.append('value', tagValue);

    try {
        const response = await fetch('/my_admin/edit_tags/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.success) {
            // Refresh the tags list
            //const tags = await fetchTags();
            //tags[tagType].push(tagValue)
            //populateList(`${tagType}-list`, tags[tagType]);
            location.reload();
            return true;
        } else {
            throw new Error(data.error || 'Failed to add tag');
        }
    } catch (error) {
        console.error('Error adding tag:', error);
        alert('Ошибка при добавлении тега: ' + error.message);
        return false;
    }
}

// Function to delete tag
async function deleteTag(tagType, tagValue) {
    const formData = new FormData();
    formData.append('formtype', 'del')
    formData.append('type', tagType);
    formData.append('value', tagValue);

    try {
        const response = await fetch('/my_admin/edit_tags/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.success) {
            // Refresh the tags list
            //const tags = await fetchTags();
            //populateList(`${tagType}-list`, tags[tagType]);
            location.reload();
            return true;
        } else {
            throw new Error(data.error || 'Failed to delete tag');
        }
    } catch (error) {
        console.error('Error deleting tag:', error);
        alert('Ошибка при удалении тега: ' + error.message);
        return false;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display initial tags
    //const tags = await fetchTags();

    //Тест
    //const tags={'authors':['Author 1', 'Author 2', 'Author 3'], 'genres':['Genre 1', 'Genre 2'], 'publishers':['Publisher one']};

    populateList('author-list', tags.authors);
    populateList('genre-list', tags.genres);
    populateList('publisher-list', tags.publishers);

    // Add event listeners for add buttons
    document.querySelectorAll('.add-tag-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const input = e.target.previousElementSibling;
            const newItem = input.value.trim();
            const tagType = e.target.dataset.tagType;

            if (newItem) {
                const success = await addTag(tagType, newItem);
                if (success) {
                    input.value = '';
                }
            }
        });
    });

    // Add event listeners for delete buttons using event delegation
    document.querySelectorAll('.list-group').forEach(list => {
        list.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-tag-btn')) {
                const button = e.target;
                const itemText = button.dataset.tagValue;
                const tagType = button.dataset.tagType;

                if (confirm(`Вы уверены, что хотите удалить "${itemText}" из ${tagType}?`)) {
                    await deleteTag(tagType, itemText);
                }
            }
        });
    });
});