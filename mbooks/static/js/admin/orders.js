        console.log('[admin/orders.js] Script loaded.'); // Лог загрузки скрипта

        // Order status mapping
        const orderStatuses = {
            1: 'Оформлен',
            2: 'Готов к получению',
            3: 'Получен',
            4: 'Отказ'
        };

        // Function to fetch user type
        /*
        async function fetchUserType() {
            try {
                // Check for test user type in localStorage
                const testUserType = localStorage.getItem('testUserType');
                if (testUserType) {
                    localStorage.removeItem('testUserType'); // Remove after use
                    return parseInt(testUserType, 10);
                }

                const response = await fetch('/my_admin/get_user_type/');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                return data.user_type;
            } catch (error) {
                console.error('Error fetching user type:', error);
                return 2; // Default to type 2 if error
            }
        }*/


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
        // Function to fetch all orders
        /*
        async function fetchOrders() {
            // Static test data for one order
            // const testOrders = [
            //     {
            //         id: 123,
            //         user_name: 'Тестовый Пользователь',
            //         date: '2023-10-27',
            //         total: 1500.50,
            //         status: 1, // Оформлен
            //         books: [
            //             { name: 'Тестовая книга 1', price: 500.25 },
            //             { name: 'Тестовая книга 2', price: 1000.25 }
            //         ]
            //     }
            // ];
            // return testOrders;

            // Original code (commented out):
            try {
                const response = await fetch('/my_admin/get_orders/');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                return data.orders;
            } catch (error) {
                console.error('Error fetching orders:', error);
                return [];
            }
        }
            */

        // Function to fetch employees
        /*
        async function fetchEmployees() {
            // Static test data for managers and admins
            // const testData = {
            //     managers: [
            //         { id: 1, login: 'test_manager', password: 'password123', email: 'manager@example.com' }
            //     ],
            //     admins: [
            //         { id: 101, login: 'test_admin', password: 'adminpassword', email: 'admin@example.com' }
            //     ]
            // };
            // return testData;

            // Original code (commented out):
            try {
                const response = await fetch('/my_admin/get_employees/');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching employees:', error);
                return { managers: [], admins: [] };
            }
        }*/

        // Function to add new manager
        async function addManager(login, password, email) {
            console.log('[admin/orders.js] addManager function called.'); // Лог входа в addManager
            const formData = new FormData();
            formData.append('type', 'addManager');
            formData.append('login', login);
            formData.append('password', password);
            formData.append('email', email);

            console.log('Sending addManager POST request.'); // Лог перед запросом

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });

                console.log('addManager response status:', response.status); // Лог статуса ответа
                const data = await response.json();
                console.log('addManager response data:', data); // Лог данных ответа
                
                if (data.success) {
                    console.log('addManager success: true.'); // Лог успешного ответа
                    // Добавляем нового менеджера в начало массива
                    if (data.manager && data.manager.id) {
                        managers.unshift({
                            id: data.manager.id,
                            login: data.manager.username,
                            email: data.manager.email
                        });
                        console.log('Manager added to local array:', managers); // Лог после добавления в массив
                        // Обновляем отображение
                        await displayEmployees();
                        console.log('displayEmployees called after adding manager.'); // Лог после вызова displayEmployees
                        return true;
                    } else {
                        console.error('Manager data missing in response:', data);
                        throw new Error('Данные менеджера отсутствуют в ответе сервера');
                    }
                } else {
                    console.error('addManager success: false. Error:', data.error); // Лог ошибки в ответе
                    throw new Error(data.error || 'Failed to add manager');
                }
            } catch (error) {
                console.error('Error in addManager fetch:', error); // Лог ошибки fetch
                alert('Ошибка при добавлении менеджера: ' + error.message);
                return false;
            }
        }

        // Function to delete manager
        async function deleteManager(managerId) {
            console.log('[admin/orders.js] deleteManager function called for ID:', managerId); // Лог входа в deleteManager
            
            if (!managerId) {
                console.error('Manager ID is undefined or null');
                alert('Ошибка: ID менеджера не указан');
                return false;
            }

            const formData = new FormData();
            formData.append('type', 'removeManager');
            formData.append('manager_id', managerId);

            console.log('Sending deleteManager POST request for ID:', managerId); // Лог перед запросом

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });
                console.log('deleteManager response status:', response.status); // Лог статуса ответа
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('deleteManager response data:', data); // Лог данных ответа
                
                if (data.success) {
                    console.log('deleteManager success: true for ID:', managerId); // Лог успешного ответа
                    // Находим элемент менеджера
                    const managerElement = document.querySelector(`[data-manager-id="${managerId}"]`);
                    console.log('Manager element found:', managerElement); // Лог найденного элемента
                    if (managerElement) {
                        const listItem = managerElement.closest('.list-group-item');
                        console.log('List item found:', listItem); // Лог найденного li
                        // Добавляем класс для анимации
                        listItem.style.opacity = '0';
                        listItem.style.transform = 'translateX(-20px)';
                        console.log('Applied fade-out style.'); // Лог применения стиля
                        // Ждем окончания анимации
                        await new Promise(resolve => setTimeout(resolve, 300));
                        console.log('Animation delay finished.'); // Лог окончания задержки
                        // Удаляем менеджера из массива
                        const index = managers.findIndex(manager => manager.id == managerId);
                        console.log('Found manager index in array:', index); // Лог индекса в массиве
                        if (index !== -1) {
                            managers.splice(index, 1);
                            console.log('Manager removed from local array.', managers); // Лог после удаления из массива
                        }
                        // Удаляем элемент из DOM
                        listItem.remove();
                        console.log('Manager element removed from DOM.'); // Лог удаления из DOM
                        return true;
                    } else {
                        console.warn('Manager element not found in DOM for ID:', managerId); // Лог, если элемент не найден
                        // Даже если элемент не найден на фронте, считаем успех, если сервер ответил положительно
                        // Удаляем менеджера из массива (повторная попытка, если первая не удалась)
                        const index = managers.findIndex(manager => manager.id == managerId);
                        if (index !== -1) {
                            managers.splice(index, 1);
                            console.log('Manager removed from local array (fallback).', managers); // Лог после удаления из массива (fallback)
                        }
                        return true; // Считаем успешным, если сервер вернул success: true
                    }
                } else {
                    console.error('deleteManager success: false. Error:', data.error); // Лог ошибки в ответе
                    throw new Error(data.error || 'Failed to delete manager');
                }
            } catch (error) {
                console.error('Error in deleteManager fetch:', error); // Лог ошибки fetch
                alert('Ошибка при удалении менеджера: ' + error.message);
                return false;
            }
        }

        // Function to display employees
        async function displayEmployees() {
            console.log('[admin/orders.js] displayEmployees function called.'); // Лог входа в displayEmployees
            console.log('Current managers:', managers); // Лог текущих менеджеров
            console.log('Current admins:', admins); // Лог текущих админов

            // Display managers
            const managersList = document.querySelector('.managers-list .list-group');
            console.log('Managers list element:', managersList); // Лог элемента менеджеров
            if (managersList) {
                managersList.innerHTML = `
                    <h4 class="bg-primary text-white rounded p-2 mb-3">Менеджеры</h4>
                    ${managers && managers.length > 0 ? managers.map(manager => `
                        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-manager-id="${manager.id}" style="color: #000; transition: opacity 0.3s ease;">
                            <div>
                                <strong>Логин:</strong> ${manager.login || manager.username} | 
                                <strong>Email:</strong> ${manager.email}
                            </div>
                            <button class="btn btn-danger btn-sm delete-manager" data-manager-id="${manager.id}">Удалить</button>
                        </div>
                    `).join('') : '<div class="list-group-item">Нет менеджеров</div>'}
                `;
                console.log('Managers list HTML populated.'); // Лог после заполнения HTML
            }

            // Display admins
            const adminsList = document.querySelector('.admins-list .list-group');
            console.log('Admins list element:', adminsList); // Лог элемента админов
            if (adminsList) {
                adminsList.innerHTML = `
                    <h4 class="bg-danger text-white rounded p-2 mb-3">Администраторы</h4>
                    ${admins && admins.length > 0 ? admins.map(admin => `
                        <div class="list-group-item">
                            <strong>Логин:</strong> ${admin.login || admin.username} | 
                            <strong>Email:</strong> ${admin.email}
                        </div>
                    `).join('') : '<div class="list-group-item">Нет администраторов</div>'}
                `;
                console.log('Admins list HTML populated.'); // Лог после заполнения HTML
            }

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-manager').forEach(button => {
                button.addEventListener('click', async (e) => {
                    console.log('[admin/orders.js] Delete manager button clicked.'); // Лог нажатия кнопки удаления менеджера
                    const managerId = e.target.closest('.list-group-item').dataset.managerId;
                    console.log('Manager ID to delete:', managerId); // Лог ID менеджера для удаления
                    if (confirm('Вы уверены, что хотите удалить этого менеджера?')) {
                        await deleteManager(managerId);
                    }
                });
            });
            console.log('Delete manager event listeners added.'); // Лог после добавления слушателей
        }

        // Function to update order status
        async function updateOrderStatus(orderId, newStatus) {
            console.log('[admin/orders.js] updateOrderStatus function called for Order ID:', orderId, 'new status:', newStatus); // Лог входа в updateOrderStatus
            const formData = new FormData();
            formData.append('type', 'changeStatus')
            formData.append('orderId', orderId);
            formData.append('newStatus', newStatus);

            console.log('Sending changeStatus POST request for Order ID:', orderId); // Лог перед запросом

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });
                console.log('updateOrderStatus response status:', response.status); // Лог статуса ответа

                if (!response.ok) {
                    console.error('Network response not ok for updateOrderStatus:', response.status, response.statusText); // Лог ошибки сети
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log('updateOrderStatus response data:', data); // Лог данных ответа
                
                if (data.success) {
                    console.log('updateOrderStatus success: true for Order ID:', orderId); // Лог успешного ответа
                    // Обновляем только кнопку статуса на фронте, без полной перезагрузки списка
                    // Это делается в обработчике клика dropdownItem
                    return true;
                } else {
                    console.error('updateOrderStatus success: false. Error:', data.error); // Лог ошибки в ответе
                    throw new Error(data.error || 'Failed to update order status');
                }
            } catch (error) {
                console.error('Error in updateOrderStatus fetch:', error); // Лог ошибки fetch
                alert('Ошибка при обновлении статуса заказа: ' + error.message);
                // Не бросаем ошибку дальше, чтобы не прерывать обработку клика
                return false; // Возвращаем false при ошибке
            }
        }

        // Function to display orders
        async function displayOrders() {
            console.log('[admin/orders.js] displayOrders function called.'); // Лог входа в displayOrders
            //const orders = await fetchOrders(); // Используем orders, которая передается через шаблон
            const ordersContainer = document.querySelector('.orders-container');
            console.log('Orders container element:', ordersContainer); // Лог элемента контейнера заказов
            ordersContainer.innerHTML = '';
            console.log('Orders container cleared.'); // Лог после очистки контейнера

            if (!orders || orders.length === 0) {
                ordersContainer.innerHTML = '<div class="alert alert-info">Заказов пока нет.</div>';
                console.log('No orders found or orders array is empty.'); // Лог отсутствия заказов
                return;
            }
            console.log('Found', orders.length, 'orders to display.'); // Лог количества заказов

            orders.forEach(order => {
                console.log('Processing order for display:', order.id); // Лог обработки заказа
                const orderCard = document.createElement('div');
                orderCard.className = 'card mb-3';

                // Определяем класс цвета кнопки статуса
                let statusButtonClass = 'btn dropdown-toggle';

                console.log('[admin/orders.js] Order ID:', order.id, 'Status ID from backend:', order.status); // Лог ID статуса с бэкенда

                switch(parseInt(order.status)) { // Используем order.status (ID) для определения цвета
                    case 1: // Оформлен - серый, закругленный
                        statusButtonClass += ' btn-secondary';
                        break;
                    case 2: // Готов к получению - синий, закругленный
                        statusButtonClass += ' btn-primary'; // Убираем rounded-0 для закругления
                        break;
                    case 3: // Получен - зеленый, закругленный
                        statusButtonClass += ' btn-success';
                        break;
                    case 4: // Отказ - красный, закругленный
                        statusButtonClass += ' btn-danger';
                        break;
                    default:
                        statusButtonClass += ' btn-secondary'; // По умолчанию серый
                }

                orderCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0">Заказ #${order.id}</h5>
                            <small class="text-muted">Дата: ${new Date(order.date).toLocaleDateString('ru-RU')}</small>
                        </div>
                        <div class="dropdown">
                            <button class="${statusButtonClass}" id="order-${order.id}-button" type="button" data-bs-toggle="dropdown">
                                ${orderStatuses[order.status]}
                            </button>
                            <ul class="dropdown-menu">
                                ${Object.entries(orderStatuses).map(([statusId, statusName]) => `
                                    <li><a class="dropdown-item" href="#" data-status="${statusId}">${statusName}</a></li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>Пользователь:</strong> ${order.user_name}</p>
                        <p><strong>Сумма:</strong> ${order.total} ₽</p>
                        <div class="books-list">
                            <strong>Книги:</strong>
                            <ul>
                                ${order.books.map(book => `
                                    <li>
                                        <div class="d-flex align-items-center mb-2">
                                            ${book.image ? `<img src="${book.image}" alt="${book.name}" class="rounded me-2" style="width: 40px; height: 60px; object-fit: cover;">` : ''}
                                            <div>
                                                ${book.name} - ${book.price} ₽ (${book.quantity || 1} шт.)
                                            </div>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;

                // Add event listener for status change
                const dropdownItems = orderCard.querySelectorAll('.dropdown-item');
                dropdownItems.forEach(item => {
                    item.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const newStatusId = e.target.dataset.status; // Получаем ID статуса
                        const newStatusName = orderStatuses[newStatusId]; // Получаем имя статуса

                        // Удаляем алерт и спрашиваем
                        try{
                            await updateOrderStatus(order.id, newStatusName);
                            // Обновляем текст и класс кнопки статуса после успешного обновления на бэкенде
                            const statusButton = document.getElementById(`order-${order.id}-button`);
                            statusButton.textContent = newStatusName;
                            // Обновляем класс кнопки
                            statusButton.className = 'btn dropdown-toggle'; // Сбрасываем текущие классы
                            switch(parseInt(newStatusId)) {
                                case 1: // Оформлен - серый
                                    statusButton.classList.add('btn-secondary');
                                    break;
                                case 2: // Готов к получению - синий, закругленный
                                    statusButton.classList.add('btn-primary'); // Убираем rounded-0
                                    break;
                                case 3: // Получен - зеленый
                                    statusButton.classList.add('btn-success');
                                    break;
                                case 4: // Отказ - красный
                                    statusButton.classList.add('btn-danger');
                                    break;
                                default:
                                    statusButton.classList.add('btn-secondary'); // По умолчанию серый
                            }
                             console.log('Status button updated for order ID:', order.id, 'new status:', newStatusName); // Лог обновления кнопки
                        }
                        catch(error){
                             console.error('Failed to update status display:', error); // Лог ошибки обновления отображения
                            // Можно добавить индикацию ошибки на фронте, если нужно
                        }
                    });
                });

                ordersContainer.appendChild(orderCard);
            });
            console.log('Finished displaying all orders.'); // Лог завершения отображения всех заказов
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('[admin/orders.js] DOM fully loaded.'); // Лог загрузки DOM
            console.log('User Type:', userType.type); // Лог типа пользователя
            
            // Check user type and show/hide employees tab
            if (userType.type === 'administrator') {
                document.getElementById('employees-tab-container').style.display = 'block';
                console.log('User is administrator, displaying employees tab.'); // Лог показа вкладки сотрудников
                // Display employees if user is admin
                await displayEmployees();
                console.log('Employees displayed.'); // Лог после отображения сотрудников
            }

            // Display initial orders
            await displayOrders();
            console.log('Initial orders displayed.'); // Лог после отображения заказов

            // Handle add manager form submission
            document.getElementById('saveManagerBtn').addEventListener('click', async () => {
                console.log('[admin/orders.js] Add Manager button clicked.'); // Лог нажатия кнопки добавления менеджера
                const login = document.getElementById('managerLogin').value;
                const password = document.getElementById('managerPassword').value;
                const email = document.getElementById('managerEmail').value;

                console.log('Attempting to add manager with login:', login); // Лог данных менеджера (без пароля)

                if (login && password && email) {
                    const success = await addManager(login, password, email);
                    if (success) {
                        console.log('Manager added successfully.'); // Лог успешного добавления
                        // Close modal and reset form
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addManagerModal'));
                        modal.hide();
                        document.getElementById('addManagerForm').reset();
                        console.log('Add Manager modal closed and form reset.'); // Лог закрытия модального окна
                    }
                     else {
                         console.log('Failed to add manager.'); // Лог неуспешного добавления
                     }
                } else {
                    console.log('Add Manager form incomplete.'); // Лог незаполненных полей
                    alert('Пожалуйста, заполните все поля');
                }
            });
             console.log('[admin/orders.js] DOMContentLoaded handler finished.'); // Лог завершения обработчика DOMContentLoaded
        });
