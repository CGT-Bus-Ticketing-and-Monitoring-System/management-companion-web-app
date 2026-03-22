document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    
    if (navbarPlaceholder) {
        navbarPlaceholder.outerHTML = `
            <header class="operator-navbar">
                <div class="logo">Obsidian Bus<br>Tracking</div>
        
                <nav class="nav-links">
                    <a href="home.html" data-page="home">Home</a>
                    <a href="my-buses.html" data-page="my-buses">My Buses</a>
                    <a href="earnings.html" data-page="earnings">Earnings</a>
                </nav>
        
                <div class="nav-actions">
                    <button class="profile-btn" id="openProfileBtn">My Profile <i class="fa-solid fa-circle-user"></i></button>
                    <button class="logout-btn">Log Out</button>
                </div>
            </header>

            <div id="profileModal" class="profile-modal-overlay">
                <div class="profile-modal-content">
                    <div class="profile-header">
                        <h2>My Profile</h2>
                        <i class="fa-solid fa-xmark close-profile" id="closeProfileModal"></i>
                    </div>
                    
                    <div class="profile-tabs">
                        <button class="tab-btn active" data-tab="basic">Basic Details</button>
                        <button class="tab-btn" data-tab="security">Security</button>
                    </div>

                    <form id="profileForm">
                        <div id="basic-tab" class="tab-content active">
                            <div class="profile-form-group">
                                <label>First Name</label>
                                <input type="text" id="profFname" class="profile-input" required>
                            </div>
                            <div class="profile-form-group">
                                <label>Last Name</label>
                                <input type="text" id="profLname" class="profile-input" required>
                            </div>
                            <div class="profile-form-group">
                                <label>Email Address</label>
                                <input type="email" id="profEmail" class="profile-input" required>
                            </div>
                            <div class="profile-form-group">
                                <label>Phone Number</label>
                                <input type="text" id="profPhone" class="profile-input" required>
                            </div>
                        </div>

                        <div id="security-tab" class="tab-content">
                            <div class="profile-form-group">
                                <label>Current Password</label>
                                <input type="password" id="currPassword" class="profile-input">
                            </div>
                            <div class="profile-form-group">
                                <label>New Password</label>
                                <input type="password" id="newPassword" class="profile-input">
                            </div>
                            <div class="profile-form-group">
                                <label>Confirm New Password</label>
                                <input type="password" id="confPassword" class="profile-input">
                            </div>
                        </div>

                        <div class="profile-actions">
                            <button type="button" class="btn btn-cancel" id="cancelProfileBtn">Cancel</button>
                            <button type="submit" class="btn btn-save">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const currentPage = document.body.getAttribute('data-active-page');
        const links = document.querySelectorAll('.operator-navbar .nav-links a');

        links.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });

        const profileModal = document.getElementById('profileModal');
        const openProfileBtn = document.getElementById('openProfileBtn');
        const closeProfileModal = document.getElementById('closeProfileModal');
        const cancelProfileBtn = document.getElementById('cancelProfileBtn');
        const profileForm = document.getElementById('profileForm');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

     if (openProfileBtn && profileModal) {
            openProfileBtn.addEventListener('click', async () => {
              
                profileModal.style.display = 'flex';

                const token = localStorage.getItem('operatorToken');
                if (!token) return;

                try {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/operator/profile`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();

                        document.getElementById('profFname').value = data.fname || '';
                        document.getElementById('profLname').value = data.lname || '';
                        document.getElementById('profEmail').value = data.email || '';
                        document.getElementById('profPhone').value = data.phone || '';
                        
                    
                        if(data.fname) localStorage.setItem('operatorFName', data.fname);
                    } else {
                        console.error('Failed to load profile details');
                    }
                } catch (error) {
                    console.error('Network error fetching profile:', error);
                }
            });
        }

        const closeModal = () => {
            profileModal.style.display = 'none';
            profileForm.reset();
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            document.querySelector('[data-tab="basic"]').classList.add('active');
            document.getElementById('basic-tab').classList.add('active');
        };

        if (closeProfileModal) closeProfileModal.addEventListener('click', closeModal);
        if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeModal);

        window.addEventListener('click', (e) => {
            if (e.target === profileModal) closeModal();
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });

   if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newPassword = document.getElementById('newPassword').value;
                const confPassword = document.getElementById('confPassword').value;

              
                if (newPassword && newPassword !== confPassword) {
                    alert("New passwords do not match!");
                    return;
                }

          
                const profileData = {
                    fname: document.getElementById('profFname').value,
                    lname: document.getElementById('profLname').value,
                    email: document.getElementById('profEmail').value,
                    phone: document.getElementById('profPhone').value,
                    currPassword: document.getElementById('currPassword').value,
                    newPassword: newPassword
                };

                const token = localStorage.getItem('operatorToken');

                try {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/operator/profile/update`, { 
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(profileData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alert("Profile updated successfully!");
                    
                        localStorage.setItem('operatorFName', profileData.fname);
                        closeModal();
                        window.location.reload();
                    } else {
                        alert(`Error: ${result.message}`);
                    }
                } catch (error) {
                    console.error("Profile Update Error:", error);
                    alert("Network error. Please try again.");
                }
            });
        }

        const logoutBtn = document.querySelector('.logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("Are you sure you want to log out?")) {
                    localStorage.removeItem('operatorToken');
                    localStorage.removeItem('operatorFName');
                    localStorage.removeItem('operatorId');
                    window.location.replace('../index.html'); 
                }
            });
        }
    }
});