const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

function validateOperatorData(data) {
    if (!emailRegex.test(data.email)) {
        Swal.fire({
            title: 'Invalid Input',
            text: 'Please enter a valid email address.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
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
        window.location.href = '../index.html';
        return;
    }

    loadOperators();
// operator form submit
    const createForm = document.getElementById('createOperatorForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                fname: document.getElementById('createFname').value,
                lname: document.getElementById('createLname').value,
                username: document.getElementById('createUsername').value,
                email: document.getElementById('createEmail').value,
                phone: document.getElementById('createPhone').value,
                password: document.getElementById('createPassword').value
            };

            if (!validateOperatorData(data)) return;

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/admin/operators/create`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                if (res.ok) {
                    Swal.fire({
                        title: 'Success',
                        text: 'Operator Registered Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    createForm.reset(); 
                    loadOperators();
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || result.error || 'Error creating operator',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error(error);
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
// operator edit
    const editForm = document.getElementById('editOperatorForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editOperatorId').value;
            const data = {
                fname: document.getElementById('editFname').value,
                lname: document.getElementById('editLname').value,
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                password: document.getElementById('editPassword').value 
            };

            if (!validateOperatorData(data)) return;

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/admin/operators/update/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                
                if (res.ok) {
                    Swal.fire({
                        title: 'Success',
                        text: 'Operator Updated Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    editForm.reset();
                    document.getElementById('editOperatorSection').style.display = 'none';
                    loadOperators();
                    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || result.error || 'Update failed',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error(error);
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

async function loadOperators() {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/operators`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const operators = await res.json();
        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = ''; 

        if (operators.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No active operators found.</td></tr>';
            return;
        }

        operators.forEach(op => {
            let statusColor = op.status === 'ACTIVE' ? '#16a34a' : '#ef4444';

            let statusToggleIcon = op.status === 'ACTIVE'
                ? `<i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #f59e0b; margin-right: 15px; font-size: 1.1rem;" onclick="updateOperatorStatus('${op.operator_id}', 'INACTIVE')" title="Deactivate Operator"></i>`
                : `<i class="fa-solid fa-check icon-edit" style="cursor: pointer; color: #16a34a; margin-right: 15px; font-size: 1.1rem;" onclick="updateOperatorStatus('${op.operator_id}', 'ACTIVE')" title="Activate Operator"></i>`;

            const row = `
                <tr>
                    <td>${op.username}</td>
                    <td>${op.phone || 'N/A'}</td>
                    <td>${op.no_of_buses}</td>
                    <td><span style="color: ${statusColor}; font-weight: 700;">${op.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;" 
                           onclick="setupEdit('${op.operator_id}', '${op.fname}', '${op.lname}', '${op.username}', '${op.email}', '${op.phone}')" title="Edit Operator"></i>
                        ${statusToggleIcon}
                        <i class="fa-solid fa-trash-can icon-delete" style="cursor: pointer; color: #ef4444; font-size: 1.1rem;" 
                           onclick="deleteOperator('${op.operator_id}')" title="Permanently Delete"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('operatorTableBody').innerHTML = '<tr class="loading-row"><td colspan="5" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
    }
}
//edit and deactivate
window.setupEdit = function(id, fname, lname, username, email, phone) {
    document.getElementById('editOperatorId').value = id;
    document.getElementById('editFname').value = fname;
    document.getElementById('editLname').value = lname;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editPhone').value = (phone !== 'null' && phone !== 'undefined') ? phone : '';
    document.getElementById('editPassword').value = '';

    const editSection = document.getElementById('editOperatorSection');
    editSection.style.display = 'block';    
    document.getElementById('editOperatorForm').scrollIntoView({ behavior: 'smooth' });
};

// Fired when the Deactivate or Activate icon is clicked
window.updateOperatorStatus = async function(id, newStatus) {
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${actionText} this operator?`,
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: newStatus === 'ACTIVE' ? '#16a34a' : '#f59e0b',
        cancelButtonColor: '#004C82',
        confirmButtonText: `Yes, ${actionText} it!`
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/operators/status/${id}`, { 
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
                text: `Operator has been ${newStatus.toLowerCase()}d.`,
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadOperators(); 
        } else {
            Swal.fire({
                title: 'Error!',
                text: `Failed to ${actionText} operator.`,
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

// Fired when the Permanent Delete icon is clicked
window.deleteOperator = async function(id) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to permanently delete this operator. This action cannot be undone!",
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', 
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, permanently delete!'
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/admin/operators/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (res.ok) {
            Swal.fire({
                title: 'Deleted!',
                text: 'Operator account has been permanently deleted.',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadOperators();
        } else {
            const result = await res.json();
            Swal.fire({
                title: 'Error',
                text: result.message || 'Failed to delete operator.',
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
    document.getElementById('editOperatorForm').reset();
    document.getElementById('editOperatorSection').style.display = 'none';
});