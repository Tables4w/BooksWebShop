
        // Order status mapping
        const orderStatuses = {
            1: 'Оформлен',
            2: 'Готов к выдаче',
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
            const formData = new FormData();
            formData.append('type', 'addManager');
            formData.append('login', login);
            formData.append('password', password);
            formData.append('email', email);

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                
                if (data.success) {
                    // Refresh employees list
                    await displayEmployees();
                    return true;
                } else {
                    throw new Error(data.error || 'Failed to add manager');
                }
            } catch (error) {
                console.error('Error adding manager:', error);
                alert('Ошибка при добавлении менеджера: ' + error.message);
                return false;
            }
        }

        // Function to delete manager
        async function deleteManager(managerId) {
            const formData = new FormData();
            formData.append('type', 'removeManager');
            formData.append('manager_id', managerId);

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                
                if (data.success) {
                    // Refresh employees list
                    await displayEmployees();
                    return true;
                } else {
                    throw new Error(data.error || 'Failed to delete manager');
                }
            } catch (error) {
                console.error('Error deleting manager:', error);
                alert('Ошибка при удалении менеджера: ' + error.message);
                return false;
            }
        }

        // Function to display employees
        async function displayEmployees() {
           // const { managers, admins } = await fetchEmployees();
            
            // Display managers
            const managersList = document.querySelector('.managers-list .list-group');
            managersList.innerHTML = managers.map(manager => `
                <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" style="color: #0d6efd;">
                    <div>
                        <strong>Логин:</strong> ${manager.login} | 
                        <strong>Пароль:</strong> ${manager.password} | 
                        <strong>Email:</strong> ${manager.email}
                    </div>
                    <button class="btn btn-danger btn-sm delete-manager" data-manager-id="${manager.id}">Удалить</button>
                </div>
            `).join('');

            // Display admins
            const adminsList = document.querySelector('.admins-list .list-group');
            adminsList.innerHTML = admins.map(admin => `
                <div class="list-group-item">
                    <strong>Логин:</strong> ${admin.login} | 
                    <strong>Пароль:</strong> ${admin.password} | 
                    <strong>Email:</strong> ${admin.email}
                </div>
            `).join('');

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-manager').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const managerId = e.target.dataset.managerId;
                    if (confirm('Вы уверены, что хотите удалить этого менеджера?')) {
                        await deleteManager(managerId);
                    }
                });
            });
        }

        // Function to update order status
        async function updateOrderStatus(orderId, newStatus) {
            const formData = new FormData();
            formData.append('type', 'changeStatus')
            formData.append('order_id', orderId);
            formData.append('status', newStatus);

            try {
                const response = await fetch('/my_admin/orders/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                
                if (data.success) {
                    // Refresh orders list
                    await displayOrders();
                    return true;
                } else {
                    throw new Error(data.error || 'Failed to update order status');
                }
            } catch (error) {
                console.error('Error updating order status:', error);
                alert('Ошибка при обновлении статуса заказа: ' + error.message);
                return false;
            }
        }

        // Function to display orders
        async function displayOrders() {
            //const orders = await fetchOrders();
            const ordersContainer = document.querySelector('.orders-container');
            ordersContainer.innerHTML = '';

            orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'card mb-3';
                orderCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Заказ #${order.id}</h5>
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
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
                        <p><strong>Дата заказа:</strong> ${order.date}</p>
                        <p><strong>Сумма:</strong> ${order.total} ₽</p>
                        <div class="books-list">
                            <strong>Книги:</strong>
                            <ul>
                                ${order.books.map(book => `
                                    <li>${book.name} - ${book.price} ₽</li>
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
                        const newStatus = e.target.dataset.status;
                        if (confirm(`Изменить статус заказа #${order.id} на "${orderStatuses[newStatus]}"?`)) {
                            await updateOrderStatus(order.id, newStatus);
                        }
                    });
                });

                ordersContainer.appendChild(orderCard);
            });
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', async () => {
            // Check user type and show/hide employees tab
            //const userType = await fetchUserType();
            //const userType='administrator';
            
            console.log('User Type:', userType.type);
            
            if (userType.type === 'administrator') {
                document.getElementById('employees-tab-container').style.display = 'block';
                // Display employees if user is admin
                await displayEmployees();
            }

            // Display initial orders
            await displayOrders();

            // Handle add manager form submission
            document.getElementById('saveManagerBtn').addEventListener('click', async () => {
                const login = document.getElementById('managerLogin').value;
                const password = document.getElementById('managerPassword').value;
                const email = document.getElementById('managerEmail').value;

                if (login && password && email) {
                    const success = await addManager(login, password, email);
                    if (success) {
                        // Close modal and reset form
                        const modal = bootstrap.Modal.getInstance(document.getElementById('addManagerModal'));
                        modal.hide();
                        document.getElementById('addManagerForm').reset();
                    }
                } else {
                    alert('Пожалуйста, заполните все поля');
                }
            });
        });
