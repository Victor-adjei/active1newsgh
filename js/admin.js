document.addEventListener('DOMContentLoaded', () => {
    const publishForm = document.getElementById('publishForm');
    const adminTable = document.getElementById('adminArticlesTable');
    
    let editingIndex = null; // Track if we are editing an article

    // Initialize Articles LocalStorage if empty
    if (!localStorage.getItem('active1news_articles')) {
        localStorage.setItem('active1news_articles', JSON.stringify([]));
    }

    // Initialize Users LocalStorage if empty
    const defaultUsers = [
        { username: 'admin', password: 'password123', name: 'Admin User', role: 'Administrator', status: 'Active' },
        { username: 'jane', password: 'password456', name: 'Jane Doe', role: 'Editor', status: 'Active' }
    ];
    if (!localStorage.getItem('active1news_users')) {
        localStorage.setItem('active1news_users', JSON.stringify(defaultUsers));
    }

    function getArticles() {
        return JSON.parse(localStorage.getItem('active1news_articles')) || [];
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem('active1news_users')) || [];
    }

    function renderAdminTable() {
        if (!adminTable) return;
        const articles = getArticles();
        
        const statTotalArticles = document.getElementById('statTotalArticles');
        if (statTotalArticles) {
            statTotalArticles.innerText = articles.length;
        }
        
        if (articles.length === 0) {
            adminTable.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No articles published yet. Publish one above!</td></tr>';
            return;
        }

        adminTable.innerHTML = articles.slice().reverse().map((article, index) => {
            const badgeClasses = {
                'news': 'badge-news',
                'entertainment': 'badge-ent',
                'sports': 'badge-sports',
                'business': 'badge-business',
                'tech': 'badge-tech'
            };
            const badgeClass = badgeClasses[article.category] || 'badge-news';
            const dateStr = new Date(article.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Calculate the actual index in the original array
            const realIndex = articles.length - 1 - index;

            return `
                <tr>
                    <td class="td-title">${article.title.substring(0, 40)}${article.title.length > 40 ? '...' : ''}</td>
                    <td><span class="badge ${badgeClass}">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</span></td>
                    <td>${dateStr}</td>
                    <td class="td-actions">
                        <button class="btn-icon" onclick="editArticle(${realIndex})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon danger" onclick="deleteArticle(${realIndex})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Render Users dynamic table
    function renderUsersTable() {
        const tbody = document.getElementById('adminUsersTable');
        if (!tbody) return;
        const users = getUsers();
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((user, index) => {
            const badgeClass = user.role.toLowerCase() === 'administrator' ? 'badge-business' : 'badge-tech';
            const statusColor = user.status.toLowerCase() === 'active' ? '#10b981' : '#ffc107';
            
            // Admin user cannot be deleted for absolute safety, but can be edited and password changed!
            const deleteBtn = user.username !== 'admin' 
                ? `<button class="btn-icon danger" onclick="deleteUser(${index})" title="Delete"><i class="fa-solid fa-trash"></i></button>`
                : '';

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ff003c&color=fff" style="width:30px; border-radius:50%;">
                            <strong>${user.name}</strong>
                        </div>
                    </td>
                    <td><span class="badge ${badgeClass}">${user.role}</span></td>
                    <td><span style="color:${statusColor}; font-weight:600; font-size:0.8rem;">${user.status}</span></td>
                    <td class="td-actions">
                        <button class="btn-icon" onclick="editUser(${index})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" onclick="changeUserPassword(${index})" title="Change Password"><i class="fa-solid fa-key"></i></button>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Handle form submission
    if (publishForm) {
        publishForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('artTitle').value;
            const category = document.getElementById('artCategory').value;
            const mediaUrl = document.getElementById('artMedia').value;
            const isVideo = document.getElementById('isVideo').checked;
            const content = document.getElementById('artContent').value;
            const fileUpload = document.getElementById('artFileUpload');
            
            const saveOrUpdateArticle = (finalMediaUrl, fileIsVideo) => {
                const articles = getArticles();
                const finalIsVideo = isVideo || fileIsVideo;
                
                if (editingIndex !== null) {
                    // Update existing article
                    articles[editingIndex] = {
                        ...articles[editingIndex],
                        title,
                        category,
                        mediaUrl: finalMediaUrl || articles[editingIndex].mediaUrl, // Keep old media if no new media provided
                        isVideo: finalIsVideo,
                        content,
                        timestamp: Date.now() // Update timestamp to refresh sorting
                    };
                    editingIndex = null;
                } else {
                    // Create new article
                    const newArticle = {
                        title,
                        category,
                        mediaUrl: finalMediaUrl,
                        isVideo: finalIsVideo,
                        content,
                        timestamp: Date.now()
                    };
                    articles.push(newArticle);
                }
                
                try {
                    localStorage.setItem('active1news_articles', JSON.stringify(articles));
                    
                    const submitBtn = publishForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved Successfully!';
                    submitBtn.style.background = '#10b981';
                    
                    // Remove Cancel button if it exists
                    const cancelBtn = document.getElementById('cancelEditBtn');
                    if (cancelBtn) cancelBtn.remove();
                    
                    publishForm.reset();
                    renderAdminTable();
                    
                    setTimeout(() => {
                        submitBtn.innerHTML = 'Publish Article';
                        submitBtn.style.background = '';
                    }, 2000);
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        alert("⚠️ Storage Limit Exceeded!\n\nThe video or image file you selected is too large for the local browser database (standard 5MB limit).\n\nTo save this article, please select a smaller file (under 2MB) or paste any YouTube video/image URL instead. This limitation will be completely bypassed when we deploy live with cloud storage!");
                    } else {
                        alert("Error saving article: " + error.message);
                    }
                    const submitBtn = publishForm.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = 'Publish Article';
                    submitBtn.style.background = '';
                }
            };

            // If a file was uploaded directly, convert it to Base64
            if (fileUpload && fileUpload.files.length > 0) {
                const file = fileUpload.files[0];
                const isUploadedVideo = file.type.startsWith('video/');
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveOrUpdateArticle(e.target.result, isUploadedVideo);
                };
                reader.readAsDataURL(file);
            } else {
                saveOrUpdateArticle(mediaUrl, false);
            }
        });
    }

    // Global function to trigger edit mode for articles
    window.editArticle = function(realIndex) {
        const articles = getArticles();
        const article = articles[realIndex];
        if (!article) return;

        editingIndex = realIndex;

        // Fill form fields
        document.getElementById('artTitle').value = article.title;
        document.getElementById('artCategory').value = article.category;
        document.getElementById('artMedia').value = article.mediaUrl.startsWith('data:') ? '' : article.mediaUrl;
        document.getElementById('isVideo').checked = article.isVideo;
        document.getElementById('artContent').value = article.content;

        // Change submit button appearance
        const submitBtn = publishForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Article';
        submitBtn.style.background = '#ffc107';
        submitBtn.style.color = '#000';

        // Add Cancel Button next to update button if not already present
        if (!document.getElementById('cancelEditBtn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.className = 'btn-primary';
            cancelBtn.style.background = '#6c757d';
            cancelBtn.style.marginTop = '10px';
            cancelBtn.style.width = '100%';
            cancelBtn.innerText = 'Cancel Editing';
            cancelBtn.addEventListener('click', () => {
                publishForm.reset();
                editingIndex = null;
                submitBtn.innerHTML = 'Publish Article';
                submitBtn.style.background = '';
                submitBtn.style.color = '';
                cancelBtn.remove();
            });
            publishForm.appendChild(cancelBtn);
        }

        // Smooth scroll to form
        document.getElementById('adminPanelWrite').scrollIntoView({ behavior: 'smooth' });
    };
    
    // Global function for deletion
    window.deleteArticle = function(realIndex) {
        if(confirm("Are you sure you want to delete this article?")) {
            const articles = getArticles();
            articles.splice(realIndex, 1);
            localStorage.setItem('active1news_articles', JSON.stringify(articles));
            renderAdminTable();
            
            // Cancel current edit if the deleted article was being edited
            if(editingIndex === realIndex) {
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) cancelBtn.click();
            }
        }
    };

    // User table operations
    window.editUser = function(index) {
        const users = getUsers();
        const user = users[index];
        if (!user) return;

        const newName = prompt('Enter new display name for the user:', user.name);
        if (newName === null) return;
        if (newName.trim() === '') {
            alert('Display name cannot be empty!');
            return;
        }

        const newUsername = prompt('Enter new login username for the user:', user.username);
        if (newUsername === null) return;
        if (newUsername.trim() === '') {
            alert('Login username cannot be empty!');
            return;
        }

        // Check if username is already taken by another user
        const usernameTaken = users.some((u, idx) => idx !== index && u.username === newUsername.trim().toLowerCase());
        if (usernameTaken) {
            alert('This username is already taken! Please choose a unique login username.');
            return;
        }

        const newRole = prompt('Enter new role (e.g. Administrator, Editor, Author):', user.role);
        if (newRole === null) return;
        if (newRole.trim() === '') {
            alert('Role cannot be empty!');
            return;
        }

        users[index].name = newName.trim();
        users[index].username = newUsername.trim().toLowerCase();
        users[index].role = newRole.trim();
        localStorage.setItem('active1news_users', JSON.stringify(users));
        renderUsersTable();
        alert('User details updated successfully!');
    };

    window.changeUserPassword = function(index) {
        const users = getUsers();
        const user = users[index];
        if (!user) return;

        const newPassword = prompt(`Enter new password for ${user.name}:`, user.password);
        if (newPassword === null) return;
        if (newPassword.trim() === '') {
            alert('Password cannot be empty!');
            return;
        }

        users[index].password = newPassword.trim();
        localStorage.setItem('active1news_users', JSON.stringify(users));
        alert(`Password for ${user.name} changed successfully! Use this password next time to log in.`);
        renderUsersTable();
    };

    window.deleteUser = function(index) {
        const users = getUsers();
        const user = users[index];
        if (!user) return;

        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            users.splice(index, 1);
            localStorage.setItem('active1news_users', JSON.stringify(users));
            renderUsersTable();
        }
    };

    // Initial renders
    renderAdminTable();
    renderUsersTable();

    // Sidebar Navigation Logic
    const sidebarLinks = document.querySelectorAll('#adminSidebar a');
    const statsGrid = document.getElementById('adminStatsGrid');
    const dashboardGrid = document.getElementById('adminDashboardGrid');
    
    // Panels
    const panelWrite = document.getElementById('adminPanelWrite');
    const panelArticles = document.getElementById('adminPanelArticles');
    const panelCategories = document.getElementById('adminPanelCategories');
    const panelUsers = document.getElementById('adminPanelUsers');
    const panelSettings = document.getElementById('adminPanelSettings');
    
    const pageHeaderTitle = document.querySelector('.page-header h2');

    const hideAllPanels = () => {
        if(panelWrite) panelWrite.style.display = 'none';
        if(panelArticles) panelArticles.style.display = 'none';
        if(panelCategories) panelCategories.style.display = 'none';
        if(panelUsers) panelUsers.style.display = 'none';
        if(panelSettings) panelSettings.style.display = 'none';
    };

    if(sidebarLinks.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all
                sidebarLinks.forEach(l => l.classList.remove('active'));
                // Add to clicked
                link.classList.add('active');
                
                const view = link.getAttribute('data-view');
                hideAllPanels();
                
                if(view === 'dashboard') {
                    pageHeaderTitle.innerText = 'Dashboard Overview';
                    statsGrid.style.display = 'grid';
                    panelWrite.style.display = 'block';
                    panelArticles.style.display = 'block';
                    dashboardGrid.style.gridTemplateColumns = window.innerWidth > 1024 ? '1fr 1.5fr' : '1fr';
                } else {
                    statsGrid.style.display = 'none';
                    dashboardGrid.style.gridTemplateColumns = '1fr';
                    
                    if(view === 'articles') {
                        pageHeaderTitle.innerText = 'All Articles';
                        panelArticles.style.display = 'block';
                    } else if(view === 'write') {
                        pageHeaderTitle.innerText = 'Write New Post';
                        panelWrite.style.display = 'block';
                    } else if(view === 'categories') {
                        pageHeaderTitle.innerText = 'Manage Categories';
                        panelCategories.style.display = 'block';
                    } else if(view === 'users') {
                        pageHeaderTitle.innerText = 'Manage Users';
                        panelUsers.style.display = 'block';
                    } else if(view === 'settings') {
                        pageHeaderTitle.innerText = 'Global Settings';
                        panelSettings.style.display = 'block';
                    }
                }
            });
        });
    }

    // Wire up interactive DOM inline editing for Categories
    const categoryEditBtns = document.querySelectorAll('#adminPanelCategories .btn-icon[title="Edit"]');
    categoryEditBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const nameCell = tr.querySelector('td strong');
            const slugCell = tr.querySelector('td:nth-child(2)');
            
            const currentName = nameCell.innerText;
            const newName = prompt('Enter new category name:', currentName);
            if (newName && newName.trim() !== '') {
                nameCell.innerText = newName.trim();
                slugCell.innerText = newName.trim().toLowerCase().replace(/\s+/g, '-');
            }
        });
    });

    // Static row delete bind for categories
    const categoryDeleteBtns = document.querySelectorAll('#adminPanelCategories .btn-icon[title="Delete"]');
    categoryDeleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm('Are you sure you want to delete this category?')) {
                e.target.closest('tr').remove();
            }
        });
    });

    const addCategoryBtn = document.querySelector('#adminPanelCategories .btn-primary');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            const catName = prompt('Enter the name of the new category:');
            if (catName && catName.trim() !== '') {
                const tbody = document.querySelector('#adminPanelCategories tbody');
                const slug = catName.trim().toLowerCase().replace(/\s+/g, '-');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${catName.trim()}</strong></td>
                    <td style="color:var(--text-muted)">${slug}</td>
                    <td>0</td>
                    <td class="td-actions">
                        <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon danger" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
                
                // Re-bind click event to new buttons
                tr.querySelector('.btn-icon[title="Edit"]').addEventListener('click', () => {
                    const nameCell = tr.querySelector('td strong');
                    const slugCell = tr.querySelector('td:nth-child(2)');
                    const currentName = nameCell.innerText;
                    const newName = prompt('Enter new category name:', currentName);
                    if (newName && newName.trim() !== '') {
                        nameCell.innerText = newName.trim();
                        slugCell.innerText = newName.trim().toLowerCase().replace(/\s+/g, '-');
                    }
                });
                tr.querySelector('.btn-icon[title="Delete"]').addEventListener('click', () => {
                    if(confirm('Are you sure you want to delete this category?')) tr.remove();
                });
            }
        });
    }

    const inviteUserBtn = document.querySelector('#adminPanelUsers .btn-primary');
    if (inviteUserBtn) {
        inviteUserBtn.addEventListener('click', () => {
            const name = prompt('Enter new user full name:');
            if (!name || name.trim() === '') return;

            const username = prompt('Enter username for login:');
            if (!username || username.trim() === '') return;

            const password = prompt('Enter password for login:');
            if (!password || password.trim() === '') return;

            const role = prompt('Enter role (e.g., Editor, Contributor):', 'Editor');
            if (!role || role.trim() === '') return;

            const users = getUsers();
            // Check if username already exists
            if (users.some(u => u.username === username.trim().toLowerCase())) {
                alert('Username already exists! Choose another one.');
                return;
            }

            users.push({
                name: name.trim(),
                username: username.trim().toLowerCase(),
                password: password.trim(),
                role: role.trim(),
                status: 'Active'
            });

            localStorage.setItem('active1news_users', JSON.stringify(users));
            renderUsersTable();
            alert(`User ${name.trim()} invited successfully! They can log in with username "${username.trim().toLowerCase()}" and their chosen password.`);
        });
    }

    // Wire up Logout Button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out from the admin panel?')) {
                localStorage.removeItem('active1news_logged_in');
                window.location.replace('login.html');
            }
        });
    }
});
