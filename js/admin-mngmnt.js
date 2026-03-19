let currentEditAdminId = null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

function validateAdminData(data) {
    if (!emailRegex.test(data.email)) {
        Swal.fire({
            title: 'Invalid Input',
            text: 'Please enter a valid email address.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82',
            
        });
        return false;
    }
    if (!phoneRegex.test(data.phone)) {
        Swal.fire({
            title: 'Invalid Input',
            text: 'Please enter a valid 10-digit mobile number.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'You must be logged in to view this page.',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    loadAdmins();

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                fname: document.getElementById('regFname').value,
                lname: document.getElementById('regLname').value,
                username: document.getElementById('regUsername').value,
                email: document.getElementById('regEmail').value,
                phone: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value
            };

            if (!validateAdminData(data)) return;

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/manage/register`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}` 
                    },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (res.ok) {
                    Swal.fire({
                        title: 'Success',
                        text: 'Admin Registered Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    registerForm.reset(); 
                    loadAdmins(); 
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error registering admin',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error('Registration Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Connection Error',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        });
    }

    const editForm = document.getElementById('editAdminForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentEditAdminId) {
                Swal.fire({
                    title: 'Warning',
                    text: 'Please select an admin to edit from the table first.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
                return;
            }

            const data = {
                fname: document.getElementById('editFname').value,
                lname: document.getElementById('editLname').value,
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                password: document.getElementById('editPassword').value 
            };

            if (!validateAdminData(data)) return;

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/manage/update/${currentEditAdminId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (res.ok) {
                    Swal.fire({
                        title: 'Success',
                        text: 'Admin Updated Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    editForm.reset();
                    currentEditAdminId = null; 
                    document.getElementById('editAdminSection').style.display = 'none';
                    loadAdmins();
                    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error updating admin',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error('Update Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Connection Error',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        });
    }
});

async function loadAdmins() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/manage`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch admins');

        const admins = await res.json();
        const tbody = document.getElementById('adminTableBody');
        tbody.innerHTML = '';

        if (admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No active admins found.</td></tr>';
            return;
        }

        admins.forEach(admin => {
            const row = `
                <tr>
                    <td>${admin.admin_id}</td>
                    <td>${admin.username}</td>
                    <td>${admin.phone}</td>
                    <td><span style="color: #16a34a; font-weight: 700;">${admin.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;"
                           onclick="setupEdit('${admin.admin_id}', '${admin.fname}', '${admin.lname}', '${admin.username}', '${admin.email}', '${admin.phone}')"></i>
                        <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #ef4444; font-size: 1.1rem;" 
                           onclick="deactivateAdmin('${admin.admin_id}')"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

window.setupEdit = function(id, fname, lname, username, email, phone) {
    currentEditAdminId = id; 
    
    document.getElementById('editFname').value = fname !== 'null' && fname !== 'undefined' ? fname : '';
    document.getElementById('editLname').value = lname !== 'null' && lname !== 'undefined' ? lname : '';
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;

    document.getElementById('editPhone').value = (phone !== 'null' && phone !== 'undefined') ? phone : '';
    document.getElementById('editPassword').value = ''; 

    const editSection = document.getElementById('editAdminSection');
    editSection.style.display = 'block';    
    document.getElementById('editAdminForm').scrollIntoView({ behavior: 'smooth' });
};
window.deactivateAdmin = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to deactivate this admin account?',
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#ff2727e5',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, deactivate it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/manage/deactivate/${id}`, { 
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                if (res.ok) {
                    Swal.fire({
                        title: 'Deactivated!',
                        text: 'Admin has been deactivated.',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    loadAdmins(); 
                } else {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Failed to deactivate admin.',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error('Deactivate Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Connection error occurred.',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        }
    });
};

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editAdminForm').reset();
    document.getElementById('editAdminSection').style.display = 'none';
});