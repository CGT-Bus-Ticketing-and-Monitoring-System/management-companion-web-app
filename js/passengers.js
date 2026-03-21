document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html'; 
        return;
    }    
    loadPassengers();
    loadAvailableCards();
// create passenger     
    const createForm = document.getElementById('createPassengerForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const first_name = document.getElementById('createFname').value.trim();
            const last_name = document.getElementById('createLname').value.trim();
            const username = document.getElementById('createUsername').value.trim();
            const email = document.getElementById('createEmail').value.trim();
            const phone = document.getElementById('createPhone').value.trim();
            const balance = document.getElementById('createBalance').value.trim();
            const card_id = document.getElementById('createCardId').value;
            const password = document.getElementById('createPassword').value;

            if (!first_name || !last_name || !username || !email || !balance || !password || !phone) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please fill in all required fields.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return Swal.fire({
                    title: 'Invalid Input',
                    text: 'Please enter a valid email address.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return Swal.fire({
                    title: 'Invalid Input',
                    text: 'Please enter a valid 10-digit mobile number.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const data = { first_name, last_name, username, email, phone, balance, card_id, password };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/create`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(data)
                });
                
                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Passenger Registered Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    createForm.reset(); 
                    loadPassengers();
                    loadAvailableCards();
                } else {
                    const result = await res.json();
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error creating passenger',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Connection Error',
                    text: 'Could not connect to the server.',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        });
    }
//edit passenger    
    const editForm = document.getElementById('editPassengerForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editPassengerId').value;
            const first_name = document.getElementById('editFname').value.trim();
            const last_name = document.getElementById('editLname').value.trim();
            const username = document.getElementById('editUsername').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const phone = document.getElementById('editPhone').value.trim();
            const balance = document.getElementById('editBalance').value.trim();
            const password = document.getElementById('editPassword').value; 

            if (!first_name || !last_name || !username || !email || !balance || !phone) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please fill in all required fields.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return Swal.fire({
                    title: 'Invalid Input',
                    text: 'Please enter a valid email address.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return Swal.fire({
                    title: 'Invalid Input',
                    text: 'Please enter a valid 10-digit mobile number.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const data = { first_name, last_name, username, email, phone, balance, password };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/update/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Passenger Updated Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    editForm.reset();
                    document.getElementById('editPassengerSection').style.display = 'none';
                    loadPassengers();
                    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
                } else {
                    const result = await res.json();
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error updating passenger',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Connection Error',
                    text: 'Could not connect to the server.',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        });
    }    
 // card replacement
    const replaceForm = document.getElementById('replaceCardForm');
    if (replaceForm) {
        // replace button
        const replaceBtn = replaceForm.querySelector('.btn-blue');
        
        if (replaceBtn) {
            replaceBtn.addEventListener('click', async (e) => {
                e.preventDefault(); //form reload
                
                const passengerId = document.getElementById('replaceUsername').value;
                const newCardId = document.getElementById('replaceNewCard').value;

                if (!passengerId || !newCardId) {
                    return Swal.fire({
                        title: 'Validation Error',
                        text: 'Please select both a passenger and a new card',
                        icon: 'warning',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }

                try {
                    const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/replace-card`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ 
                            passenger_id: passengerId, 
                            new_card_id: newCardId 
                        })
                    });

                    if (res.ok) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Card Replaced Successfully!',
                            icon: 'success',
                            iconColor: '#004C82',
                            confirmButtonColor: '#004C82'
                        });
                        loadPassengers(); 
                        loadAvailableCards(); 
                    } else {
                        const result = await res.json();
                        Swal.fire({
                            title: 'Error',
                            text: result.message || 'Failed to replace card',
                            icon: 'error',
                            iconColor: '#004C82',
                            confirmButtonColor: '#004C82'
                        });
                    }
                } catch (error) {
                    console.error('Replacement Error:', error);
                    Swal.fire({
                        title: 'Connection Error',
                        text: 'Could not connect to the server.',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            });
        }
    }
});

// data loading
async function loadPassengers() {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/passengers`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const passengers = await res.json();
        const tbody = document.querySelector('.data-table tbody');
        const replaceUserDropdown = document.getElementById('replaceUsername');
        
        tbody.innerHTML = ''; 
        if (replaceUserDropdown) {
            replaceUserDropdown.innerHTML = '<option value="">-- Select Username --</option>';
        }

        passengers.forEach(p => {
            const currentStatus = p.status || p.acc_status || 'ACTIVE';
            let statusColor = currentStatus === 'ACTIVE' ? '#16a34a' : '#ef4444';

            let statusToggleIcon = currentStatus === 'ACTIVE'
                ? `<i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #f59e0b; margin-right: 15px; font-size: 1.1rem;" onclick="updatePassengerStatus('${p.passenger_id}', 'INACTIVE')" title="Deactivate Passenger"></i>`
                : `<i class="fa-solid fa-check icon-edit" style="cursor: pointer; color: #16a34a; margin-right: 15px; font-size: 1.1rem;" onclick="updatePassengerStatus('${p.passenger_id}', 'ACTIVE')" title="Activate Passenger"></i>`;

            const cardStatusText = p.card_status || 'N/A';
            let cardStatusColor = '#4d4f51';
            
            if (cardStatusText === 'ACTIVE') {
                cardStatusColor = '#10b981';
            } else if (cardStatusText === 'BLOCKED') {
                cardStatusColor = '#e74c3c'; 
            } else if (cardStatusText === 'LOST') {
                cardStatusColor = '#f59e0b'; 
            } else if (cardStatusText === 'AVAILABLE') {
                cardStatusColor = '#004C82'; 
            }

            const row = `
                <tr>
                    <td>${p.username}</td>
                    <td>${p.balance}</td>
                    <td>${p.card_number || 'N/A'}</td>
                    <td><span style="color: ${cardStatusColor}; font-weight: bold;">${cardStatusText}</span></td>
                    <td><span style="color: ${statusColor}; font-weight: bold;">${currentStatus}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;"
                           onclick="setupEdit('${p.passenger_id}', '${p.first_name}', '${p.last_name}', '${p.username}', '${p.email}', '${p.phone}', '${p.balance}')" title="Edit Passenger"></i>
                        ${statusToggleIcon}
                        <i class="fa-solid fa-trash-can icon-delete" style="cursor: pointer; color: #ef4444; font-size: 1.1rem;" 
                           onclick="deletePassenger('${p.passenger_id}')" title="Permanently Delete"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
            if (replaceUserDropdown) {
                replaceUserDropdown.innerHTML += `<option value="${p.passenger_id}">${p.username}</option>`;
            }
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.querySelector('.data-table tbody').innerHTML = '<tr class="loading-row"><td colspan="6" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
    }
}

async function loadAvailableCards() {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/available-cards`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch cards');
        
        const cards = await res.json();
        const regCardSelect = document.getElementById('createCardId');
        const replaceCardSelect = document.getElementById('replaceNewCard');

        let options = '<option value="">-- Select Card --</option>';
        cards.forEach(card => {
            options += `<option value="${card.card_id}">${card.rfid_uid}</option>`;
        });

        if (regCardSelect) regCardSelect.innerHTML = options;
        if (replaceCardSelect) replaceCardSelect.innerHTML = options;
        
    } catch (error) {
        console.error('Error loading cards:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to load available cards.',
            icon: 'error',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }
}
//action helpers
window.setupEdit = function(id, fname, lname, username, email, phone, balance) {
    document.getElementById('editPassengerId').value = id;
    document.getElementById('editFname').value = fname;
    document.getElementById('editLname').value = lname;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editPhone').value = (phone !== 'null' && phone !== 'undefined') ? phone : '';
    document.getElementById('editBalance').value = balance;
    document.getElementById('editPassword').value = ''; 

    const editSection = document.getElementById('editPassengerSection');
    editSection.style.display = 'block';    
    document.getElementById('editPassengerForm').scrollIntoView({ behavior: 'smooth' });
};

// Fired when Deactivate or Activate icon is clicked
window.updatePassengerStatus = async function(id, newStatus) {
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${actionText} this passenger account?`,
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: newStatus === 'ACTIVE' ? '#16a34a' : '#f59e0b',
        cancelButtonColor: '#004C82',
        confirmButtonText: `Yes, ${actionText} it!`
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/status/${id}`, { 
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
                text: `Passenger has been ${newStatus.toLowerCase()}d.`,
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadPassengers(); 
        } else {
            Swal.fire({
                title: 'Error!',
                text: `Failed to ${actionText} passenger.`,
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    } catch (error) {
        Swal.fire({ title: 'Error', text: 'Connection Error', icon: 'error', confirmButtonColor: '#004C82' });
    }
};

// Fired when the Permanent Delete icon is clicked
window.deletePassenger = async function(id) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to permanently delete this passenger. This action cannot be undone!",
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', 
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, permanently delete!'
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (res.ok) {
            Swal.fire({ title: 'Deleted!', text: 'Passenger has been permanently deleted.', icon: 'success', iconColor: '#004C82', confirmButtonColor: '#004C82' });
            loadPassengers();
        } else {
            Swal.fire({ title: 'Error', text: 'Failed to delete passenger.', icon: 'error', confirmButtonColor: '#004C82' });
        }
    } catch (error) {
        Swal.fire({ title: 'Error', text: 'Connection Error', icon: 'error', confirmButtonColor: '#004C82' });
    }
};

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editPassengerForm').reset();
    document.getElementById('editPassengerSection').style.display = 'none';
});