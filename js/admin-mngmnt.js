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
            let statusColor = admin.status === 'ACTIVE' ? '#16a34a' : '#ef4444';

            let statusToggleIcon = admin.status === 'ACTIVE'
                ? `<i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #f59e0b; margin-right: 15px; font-size: 1.1rem;" onclick="updateAdminStatus('${admin.admin_id}', 'INACTIVE')" title="Deactivate Admin"></i>`
                : `<i class="fa-solid fa-check icon-edit" style="cursor: pointer; color: #16a34a; margin-right: 15px; font-size: 1.1rem;" onclick="updateAdminStatus('${admin.admin_id}', 'ACTIVE')" title="Activate Admin"></i>`;

            const row = `
                <tr>
                    <td>${admin.username}</td>
                    <td>${admin.phone}</td>
                    <td><span style="color: ${statusColor}; font-weight: 700;">${admin.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;"
                           onclick="setupEdit('${admin.admin_id}', '${admin.fname}', '${admin.lname}', '${admin.username}', '${admin.email}', '${admin.phone}')" title="Edit Admin"></i>
                        ${statusToggleIcon}
                        <i class="fa-solid fa-trash-can icon-delete" style="cursor: pointer; color: #ef4444; font-size: 1.1rem;" 
                           onclick="deleteAdmin('${admin.admin_id}')" title="Permanently Delete"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('adminTableBody').innerHTML = '<tr class="loading-row"><td colspan="4" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
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

// Fired when the Ban (Deactivate) or Check (Activate) icon is clicked
window.updateAdminStatus = async function(id, newStatus) {
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${actionText} this admin account?`,
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: newStatus === 'ACTIVE' ? '#16a34a' : '#f59e0b',
        cancelButtonColor: '#004C82',
        confirmButtonText: `Yes, ${actionText} it!`
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/manage/status/${id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            Swal.fire({
                title: 'Success!',
                text: `Admin has been ${newStatus.toLowerCase()}d.`,
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadAdmins(); 
        } else {
            Swal.fire({
                title: 'Error!',
                text: `Failed to ${actionText} admin.`,
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    } catch (error) {
        console.error('Status Update Error:', error);
        Swal.fire({
            title: 'Connection Error',
            text: 'Could not connect to the server.',
            icon: 'error',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }
};

// Fired when the Trash Can (Permanent Delete) icon is clicked
window.deleteAdmin = async function(id) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to permanently delete this admin. This action cannot be undone!",
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, permanently delete!'
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/manage/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (res.ok) {
            Swal.fire({
                title: 'Deleted!',
                text: 'Admin account has been permanently deleted.',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadAdmins();
        } else {
            const result = await res.json();
            Swal.fire({
                title: 'Error',
                text: result.message || 'Failed to delete admin.',
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    } catch (error) {
        console.error('Delete Error:', error);
        Swal.fire({
            title: 'Connection Error',
            text: 'Could not connect to the server.',
            icon: 'error',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }
};

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editAdminForm').reset();
    document.getElementById('editAdminSection').style.display = 'none';
});