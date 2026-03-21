let selectedRole = ''; 

function selectRole(role) {
    selectedRole = role;
    
    document.getElementById('roleModal').classList.add('hidden');
    
    const loginTitle = document.querySelector('.login-card h3');
    if (loginTitle) {
        if (role === 'admin') {
            loginTitle.innerText = 'Admin Login';
        } else if (role === 'operator') {
            loginTitle.innerText = 'Operator Login';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            if (!selectedRole) {
                document.getElementById('roleModal').classList.remove('hidden');
                return;
            }

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;

            const apiUrl = `${CONFIG.API_BASE_URL}/${selectedRole}/login`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.clear();

                    localStorage.setItem('userRole', selectedRole);

                    if (selectedRole === 'admin') {
                        localStorage.setItem('adminToken', result.token);
                        localStorage.setItem('adminFName', result.fname);
                        
                        showToast('Admin login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'admin/home.html';
                        }, 1000);
                        
                    } else if (selectedRole === 'operator') {
                        localStorage.setItem('operatorToken', result.token);
                        localStorage.setItem('operatorFName', result.fname);
                        localStorage.setItem('operatorId', result.operator_id);
                        
                        showToast('Operator login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'operator/home.html';
                        }, 1000);
                    }
                    
                } else {
                    showToast(result.message || 'Invalid username or password.', 'error');
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error('Network Error:', error);
                showToast('Could not connect to the server.', 'error');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

// Toggle Password Visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }
});

// Toast Notification Logic
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconClass = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon ${type}" style="font-size: 1.4rem;"></i>
        <span style="font-size: 0.95rem; font-weight: 500;">${message}</span>
    `;
    
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 5000);
}