
let currentEditAdminId = null;

document.addEventListener('DOMContentLoaded', () => {
  
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert('You must be logged in to view this page.');
        window.location.href = 'index.html';
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
                    alert('Admin Registered Successfully!');
                    registerForm.reset(); 
                    loadAdmins(); 
                } else {
                    alert(result.message || 'Error registering admin');
                }
            } catch (error) {
                console.error('Registration Error:', error);
                alert('Connection Error');
            }
        });
    }


    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentEditAdminId) {
                alert('Please select an admin to edit from the table first.');
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
                    alert('Admin Updated Successfully!');
                    editForm.reset();
                    currentEditAdminId = null; 
                    loadAdmins();
                    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(result.message || 'Error updating admin');
                }
            } catch (error) {
                console.error('Update Error:', error);
                alert('Connection Error');
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
                    <td><span style="color: green; font-weight: bold;">${admin.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-file-pen icon-edit" style="cursor: pointer; color: #3498db; margin-right: 10px;" 
                           onclick="setupEdit('${admin.admin_id}', '${admin.fname}', '${admin.lname}', '${admin.username}', '${admin.email}', '${admin.phone}')"></i>
                        <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #e74c3c;" 
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
    
    document.getElementById('editFname').value = fname;
    document.getElementById('editLname').value = lname;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editPhone').value = phone;
    document.getElementById('editPassword').value = ''; 

  
    document.getElementById('editForm').scrollIntoView({ behavior: 'smooth' });
};


window.deactivateAdmin = async function(id) {
    if(!confirm('Are you sure you want to deactivate this admin account?')) return;

    try {
        
        const res = await fetch(`${CONFIG.API_BASE_URL}/manage/deactivate/${id}`, { 
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (res.ok) {
            alert('Admin deactivated');
            loadAdmins(); 
        } else {
            alert('Failed to deactivate admin');
        }
    } catch (error) {
        console.error('Deactivate Error:', error);
    }
};