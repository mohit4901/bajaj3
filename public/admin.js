document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const adminProductsContainer = document.getElementById('admin-product-list');
    const logoutButton = document.getElementById('logout-btn');

    const addProductBtn = document.getElementById('add-product-btn');
    const newProductFormContainer = document.getElementById('new-product-form-container');
    const newProductForm = document.getElementById('new-product-form');
    const cancelNewProductBtn = document.getElementById('cancel-new-product');
    const newProductMessage = document.getElementById('new-product-message');

    // Custom Modal elements
    const messageModalOverlay = document.getElementById('message-modal-overlay');
    const messageModalTitle = document.getElementById('message-modal-title');
    const messageModalText = document.getElementById('message-modal-text');
    const messageModalOkBtn = document.getElementById('message-modal-ok-btn');

    // Function to show a custom message box
    function showMessage(title, message) {
        messageModalTitle.textContent = title;
        messageModalText.textContent = message;
        messageModalOverlay.classList.add('visible');
    }

    // Function to hide the custom message box
    function hideMessage() {
        messageModalOverlay.classList.remove('visible');
    }

    if (messageModalOkBtn) {
        messageModalOkBtn.addEventListener('click', hideMessage);
        messageModalOverlay.addEventListener('click', (e) => {
            if (e.target === messageModalOverlay) {
                hideMessage();
            }
        });
    }

    const ADMIN_TOKEN_KEY = 'adminAuthToken'; // Key for storing token in localStorage

    // --- Login Page Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            loginMessage.style.display = 'none'; // Hide previous messages
            loginMessage.textContent = ''; // Clear previous message text

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) { 
                    let errorData = { message: 'Login failed due to server error.' };
                    try {
                        errorData = await response.json(); 
                    } catch (jsonError) {
                        const rawResponseText = await response.text(); // Get raw text if not JSON
                        console.error('Frontend: Failed to parse error response as JSON:', jsonError, 'Raw response:', rawResponseText);
                        errorData.message = `Server responded with status ${response.status} ${response.statusText}. Response was not JSON. Raw: "${rawResponseText.substring(0, 100)}..."`;
                    }
                    loginMessage.textContent = errorData.message || `Login failed with status: ${response.status}`;
                    loginMessage.style.display = 'block';
                    console.error('Frontend: Login failed:', errorData.message);
                } else {
                    const data = await response.json();
                    localStorage.setItem(ADMIN_TOKEN_KEY, data.token); // Store the token
                    window.location.href = 'admin_panel.html'; // Redirect to admin panel
                }
            } catch (error) {
                console.error('Frontend: Error during login:', error);
                loginMessage.textContent = `An error occurred: ${error.message}`;
                loginMessage.style.display = 'block';
            }
        });
    }

    // --- Admin Panel Page Logic ---
    if (adminProductsContainer) {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
            window.location.href = 'admin_login.html'; // Redirect if no token
            return;
        }

        // Event listener for Logout button
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                window.location.href = 'admin_login.html';
            });
        }

        // Event listener for Add New Product button
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                newProductFormContainer.style.display = 'block';
                addProductBtn.style.display = 'none';
            });
        }

        // Event listener for Cancel button on new product form
        if (cancelNewProductBtn) {
            cancelNewProductBtn.addEventListener('click', () => {
                newProductFormContainer.style.display = 'none';
                addProductBtn.style.display = 'block';
                newProductForm.reset();
                newProductMessage.style.display = 'none';
            });
        }

        // Event listener for New Product Form submission
        if (newProductForm) {
            newProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newProduct = {
                    number: document.getElementById('new-number').value,
                    description: document.getElementById('new-description').value,
                    cost: document.getElementById('new-cost').value,
                    availability: document.getElementById('new-availability').value,
                    imageurl: document.getElementById('new-imageurl').value
                };
                
                try {
                    const response = await fetch('/api/products', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(newProduct)
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            showMessage('Error', 'Session expired or unauthorized. Please log in again.');
                            localStorage.removeItem(ADMIN_TOKEN_KEY);
                            window.location.href = 'admin_login.html';
                            return;
                        }
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Failed to add product with status: ${response.status}`);
                    }

                    newProductForm.reset();
                    newProductMessage.textContent = 'Product added successfully!';
                    newProductMessage.style.display = 'block';
                    newProductMessage.style.color = 'var(--secondary-color)';
                    fetchProductsForAdmin();
                } catch (error) {
                    console.error('Admin Frontend: Error adding new product:', error);
                    newProductMessage.textContent = `Failed to add product: ${error.message}`;
                    newProductMessage.style.display = 'block';
                    newProductMessage.style.color = 'var(--primary-color)';
                }
            });
        }

        // Function to fetch and render products for admin
        async function fetchProductsForAdmin() {
            try {
                adminProductsContainer.innerHTML = '<p class="admin-message">Loading products...</p>';
                console.log('Admin Frontend: Attempting to fetch products from /api/products');
                
                const response = await fetch('/api/products', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 403) {
                        showMessage('Error', 'Session expired or unauthorized. Please log in again.');
                        localStorage.removeItem(ADMIN_TOKEN_KEY);
                        window.location.href = 'admin_login.html';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const products = await response.json();
                renderAdminProducts(products);
            } catch (error) {
                console.error('Admin Frontend: Error fetching products:', error);
                adminProductsContainer.innerHTML = `<p class="admin-message">Failed to load products. ${error.message}</p>`;
            }
        }
        
        // Function to render products in an editable table for admin
        function renderAdminProducts(products) {
            if (products.length === 0) {
                adminProductsContainer.innerHTML = '<p class="admin-message">No products found.</p>';
                return;
            }

            const tableHtml = `
                <div class="products-table-container">
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Number</th>
                                <th>Description</th>
                                <th>Cost</th>
                                <th>Availability</th>
                                <th>Image URL</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map((product, index) => `
                                <tr data-id="${product.id}" data-index="${index}">
                                    <td>${product.id}</td>
                                    <td>${product.number}</td>
                                    <td>${product.description}</td>
                                    <td>${product.cost}</td>
                                    <td>${product.availability}</td>
                                    <td><a href="${product.imageurl}" target="_blank">View Image</a></td>
                                    <td class="table-actions">
                                        <button class="btn-edit">Edit</button>
                                        <button class="btn-delete">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            adminProductsContainer.innerHTML = tableHtml;
        }

        // Delegate click events for edit and delete buttons
        adminProductsContainer.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            const rowIndex = row.dataset.index;
            const productId = row.dataset.id;

            if (e.target.classList.contains('btn-edit')) {
                toggleEditModeAdmin(rowIndex, true);
            } else if (e.target.classList.contains('btn-delete')) {
                // Use custom modal instead of confirm()
                showMessage('Confirm Deletion', 'Are you sure you want to delete this product?');
                messageModalOkBtn.onclick = () => {
                    hideMessage();
                    deleteProduct(productId);
                };
            } else if (e.target.classList.contains('btn-save')) {
                const updatedProduct = getUpdatedProductData(row);
                if (updatedProduct) {
                    updateProduct(productId, updatedProduct, rowIndex);
                }
            } else if (e.target.classList.contains('btn-cancel')) {
                toggleEditModeAdmin(rowIndex, false);
            }
        });
        
        function getUpdatedProductData(row) {
            try {
                const inputs = row.querySelectorAll('input');
                return {
                    id: row.dataset.id,
                    number: inputs[0].value,
                    description: inputs[1].value,
                    cost: inputs[2].value,
                    availability: inputs[3].value,
                    imageurl: inputs[4].value
                };
            } catch (error) {
                console.error("Failed to get updated product data:", error);
                return null;
            }
        }
        
        function toggleEditModeAdmin(rowIndex, isEditMode) {
            const row = document.querySelector(`tr[data-index="${rowIndex}"]`);
            if (!row) return;
            const cells = row.querySelectorAll('td');

            if (isEditMode) {
                cells[1].innerHTML = `<input type="text" value="${cells[1].textContent}">`;
                cells[2].innerHTML = `<input type="text" value="${cells[2].textContent}">`;
                cells[3].innerHTML = `<input type="text" value="${cells[3].textContent}">`;
                cells[4].innerHTML = `<input type="text" value="${cells[4].textContent}">`;
                const imageUrl = cells[5].querySelector('a') ? cells[5].querySelector('a').href : '';
                cells[5].innerHTML = `<input type="text" value="${imageUrl}">`;
                cells[6].innerHTML = `
                    <div class="table-actions">
                        <button class="btn-save">Save</button>
                        <button class="btn-cancel">Cancel</button>
                    </div>
                `;
            } else {
                fetchProductsForAdmin(); // Re-render to show original data
            }
        }

        async function updateProduct(id, updatedProduct, rowIndex) {
            try {
                const response = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedProduct)
                });

                if (!response.ok) {
                    if (response.status === 403) { 
                        showMessage('Error', 'Session expired or unauthorized. Please log in again.');
                        localStorage.removeItem(ADMIN_TOKEN_KEY);
                        window.location.href = 'admin_login.html';
                        return;
                    }
                    let errorData = { error: `Failed to update product at row ${rowIndex} due to server error.` };
                    try {
                        errorData = await response.json();
                    } catch (jsonError) {
                        const rawResponseText = await response.text();
                        console.error('Frontend: Failed to parse error response as JSON:', jsonError, 'Raw response:', rawResponseText);
                        errorData.error = `Server responded with status ${response.status} ${response.statusText}. Response was not JSON. Raw: "${rawResponseText.substring(0, 100)}..."`;
                    }
                    throw new Error(errorData.error);
                }
                console.log(`Admin Frontend: Successfully updated product at row ${rowIndex}. Response:`, await response.json());

                showMessage('Success', 'Product updated successfully!');
                fetchProductsForAdmin(); 

            } catch (error) {
                console.error('Admin Frontend: Error updating product:', error);
                showMessage('Error', `Failed to update product: ${error.message}`);
            } finally {
                toggleEditModeAdmin(rowIndex, false);
            }
        }
        
        async function deleteProduct(id) {
            try {
                const response = await fetch(`/api/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        showMessage('Error', 'Session expired or unauthorized. Please log in again.');
                        localStorage.removeItem(ADMIN_TOKEN_KEY);
                        window.location.href = 'admin_login.html';
                        return;
                    }
                    let errorData = await response.json();
                    throw new Error(errorData.error || `Failed to delete product with status: ${response.status}`);
                }

                console.log(`Admin Frontend: Successfully deleted product with ID: ${id}`);
                showMessage('Success', 'Product deleted successfully!');
                fetchProductsForAdmin();
            } catch (error) {
                console.error('Admin Frontend: Error deleting product:', error);
                showMessage('Error', `Failed to delete product: ${error.message}`);
            }
        }

        fetchProductsForAdmin();
    }
});
