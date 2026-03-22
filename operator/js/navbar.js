document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    
    if (navbarPlaceholder) {
        navbarPlaceholder.outerHTML = `
            <header class="operator-navbar">
                <div class="logo">Bus<br>Buddy</div>
        
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
                            <button type="submit" class="btn btn-save">Save Changes</button>
                            <button type="button" class="btn btn-cancel" id="cancelProfileBtn">Cancel</button>
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
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        document.getElementById('profFname').value = data.fname || '';
                        document.getElementById('profLname').value = data.lname || '';
                        document.getElementById('profEmail').value = data.email || '';
                        document.getElementById('profPhone').value = data.phone || '';
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

                const phone = document.getElementById('profPhone').value.trim();
                const newPassword = document.getElementById('newPassword').value;
                const confPassword = document.getElementById('confPassword').value;

                const phoneRegex = /^\d{10}$/;
                if (!phoneRegex.test(phone)) {
                    Swal.fire({
                        title: 'Invalid Phone Number',
                        text: 'Please enter a valid 10-digit phone number.',
                        icon: 'warning',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82',
                        target: document.getElementById('profileModal')
                    });
                    return; 
                }

                if (newPassword && newPassword !== confPassword) {
                    Swal.fire({
                        title: 'Password Mismatch',
                        text: 'New passwords do not match!',
                        icon: 'warning',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82',
                        target: document.getElementById('profileModal')
                    });
                    return;
                }

                const profileData = {
                    fname: document.getElementById('profFname').value.trim(),
                    lname: document.getElementById('profLname').value.trim(),
                    email: document.getElementById('profEmail').value.trim(),
                    phone: phone, 
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
                        Swal.fire({
                            title: 'Success!',
                            text: 'Profile updated successfully!',
                            icon: 'success',
                            iconColor: '#004C82',
                            confirmButtonColor: '#004C82'
                        }).then(() => {
                            localStorage.setItem('operatorFName', profileData.fname);
                            closeModal();
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: 'Update Failed',
                            text: result.message || result.error || 'Something went wrong. Please try again.',
                            icon: 'error',
                            iconColor: '#004C82',
                            confirmButtonColor: '#004C82',
                            target: document.getElementById('profileModal')
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Network error. Please try again.',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82',
                        target: document.getElementById('profileModal') 
                    });
                }
            });
        }

        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You will be logged out of your account.",
                    icon: 'question',
                    iconColor: '#004C82',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#004C82',
                    confirmButtonText: 'Yes, Log Out'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.clear(); 
                        window.location.replace('../index.html'); 
                    }
                });
            });
        }
    }
});