document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginCard = document.getElementById('loginCard');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // Initialize Users LocalStorage if empty
    const defaultUsers = [
        { username: 'admin', password: 'password123', name: 'Admin User', role: 'Administrator', status: 'Active' },
        { username: 'jane', password: 'password456', name: 'Jane Doe', role: 'Editor', status: 'Active' }
    ];
    if (!localStorage.getItem('active1news_users')) {
        localStorage.setItem('active1news_users', JSON.stringify(defaultUsers));
    }

    // If already logged in, redirect to admin
    if (localStorage.getItem('active1news_logged_in') === 'true') {
        window.location.replace('admin.html');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value.trim().toLowerCase();
            const passwordInput = document.getElementById('password').value;

            // Load users dynamically from LocalStorage
            const users = JSON.parse(localStorage.getItem('active1news_users')) || [];
            
            // Check if credentials match any user in our system
            const matchedUser = users.find(u => u.username === usernameInput && u.password === passwordInput);

            if (matchedUser) {
                // Success
                localStorage.setItem('active1news_logged_in', 'true');
                localStorage.setItem('active1news_current_user', JSON.stringify(matchedUser));
                
                // Show success button state
                const submitBtn = loginForm.querySelector('.btn-submit');
                submitBtn.innerHTML = '<span>Success! Redirecting...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
                submitBtn.style.background = '#10b981';
                submitBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';

                setTimeout(() => {
                    window.location.replace('admin.html');
                }, 1000);

            } else {
                // Fail - Trigger Shake and Error Message
                errorAlert.style.display = 'flex';
                errorMessage.innerText = 'Incorrect username or password. Check your details or contact your admin.';

                // Add shake class
                loginCard.classList.add('shake');

                // Remove shake class after animation completes so it can be re-triggered
                setTimeout(() => {
                    loginCard.classList.remove('shake');
                }, 500);
            }
        });
    }
});
