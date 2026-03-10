document.addEventListener('DOMContentLoaded', () => {    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html'; 
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
                    alert('Operator Registered Successfully!');
                    createForm.reset(); 
                    loadOperators();    
                } else {
                    alert(result.message || result.error || 'Error creating operator');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
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
                    alert('Operator Updated Successfully!');
                    editForm.reset();
                    loadOperators();        
                    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(result.message || result.error || 'Update failed');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
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
                    <td><span style="color: green; font-weight: bold;">${op.status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" 
                           onclick="setupEdit('${op.operator_id}', '${op.fname}', '${op.lname}', '${op.username}', '${op.email}', '${op.phone}')"></i>                        
                        <i class="fa-solid fa-trash icon-delete" 
                           onclick="deactivateOperator('${op.operator_id}')"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading operators:', error);
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
    document.getElementById('editOperatorForm').scrollIntoView({ behavior: 'smooth' });
};
window.deactivateOperator = async function(id) {
    
    if (!confirm('Are you sure you want to deactivate this operator?')) return;
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/operators/deactivate/${id}`, { 
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });        
        if (res.ok) {
            loadOperators(); 
        } else {
            const result = await res.json();
            alert(result.message || 'Failed to deactivate operator');
        }
    } catch (error) {
        console.error(error);
        alert('Connection Error');
    }
};