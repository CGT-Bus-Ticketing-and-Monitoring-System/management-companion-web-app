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
                const res = await fetch(`${CONFIG.API_BASE_URL}/operators/create`, {
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
                const res = await fetch(`${CONFIG.API_BASE_URL}/operators/update/${id}`, {
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
        const res = await fetch(`${CONFIG.API_BASE_URL}/operators`, {
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
            const row = `
                <tr>
                    <td>${op.operator_id}</td>
                    <td>${op.username}</td>
                    <td>${op.phone || 'N/A'}</td>
                    <td>${op.no_of_buses}</td>
                    <td><span style="color: #16a34a; font-weight: 700;">${op.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;" 
                           onclick="setupEdit('${op.operator_id}', '${op.fname}', '${op.lname}', '${op.username}', '${op.email}', '${op.phone}')"></i>
                        <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #ef4444; font-size: 1.1rem;" 
                           onclick="deactivateOperator('${op.operator_id}')"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('operatorTableBody').innerHTML = '<tr class="loading-row"><td colspan="6" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
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

window.deactivateOperator = function(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to deactivate this operator?',
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, deactivate it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const token = localStorage.getItem('adminToken');
            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/operators/deactivate/${id}`, { 
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (res.ok) {
                    Swal.fire({
                        title: 'Deactivated!',
                        text: 'Operator has been deactivated.',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    loadOperators(); 
                } else {
                    const resultData = await res.json();
                    Swal.fire({
                        title: 'Error!',
                        text: resultData.message || 'Failed to deactivate operator.',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error(error);
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
    document.getElementById('editOperatorForm').reset();
    document.getElementById('editOperatorSection').style.display = 'none';
});