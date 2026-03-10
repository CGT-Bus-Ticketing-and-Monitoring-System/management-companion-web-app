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
            const data = {
                first_name: document.getElementById('createFname').value,
                last_name: document.getElementById('createLname').value,
                username: document.getElementById('createUsername').value,
                email: document.getElementById('createEmail').value,
                phone: document.getElementById('createPhone').value,
                balance: document.getElementById('createBalance').value,
                card_id: document.getElementById('createCardId').value,
                password: document.getElementById('createPassword').value
            };

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
                    alert('Passenger Registered Successfully!');
                    createForm.reset(); 
                    loadPassengers();
                    loadAvailableCards();
                } else {
                    const result = await res.json();
                    alert(result.message || 'Error creating passenger');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
            }
        });
    }

    //edit passenger
    
    const editForm = document.getElementById('editPassengerForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editPassengerId').value;
            const data = {
                first_name: document.getElementById('editFname').value,
                last_name: document.getElementById('editLname').value,
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                balance: document.getElementById('editBalance').value,
                password: document.getElementById('editPassword').value 
            };

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
                    alert('Passenger Updated Successfully!');
                    editForm.reset();
                    loadPassengers();
                    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
                }
            } catch (error) {
                console.error(error);
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
                    alert('Please select both a passenger and a new card');
                    return;
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
                        alert('Card Replaced Successfully!');
                        loadPassengers(); 
                        loadAvailableCards(); 
                    } else {
                        const result = await res.json();
                        alert(result.message || 'Failed to replace card');
                    }
                } catch (error) {
                    console.error('Replacement Error:', error);
                    alert('Connection Error');
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
            const row = `
                <tr>
                    <td>${p.passenger_id}</td>
                    <td>${p.username}</td>
                    <td>${p.balance}</td>
                    <td>${p.card_number || 'N/A'}</td>
                    <td><span style="color: ${p.card_status === 'ACTIVE' ? 'green' : 'red'};">${p.card_status || 'N/A'}</span></td>
                    <td><span style="color: green; font-weight: bold;">${p.acc_status}</span></td>
                    <td class="action-icons">
                        <i class="fa-solid fa-file-pen icon-edit" onclick="setupEdit('${p.passenger_id}', '${p.first_name}', '${p.last_name}', '${p.username}', '${p.email}', '${p.phone}', '${p.balance}')"></i>
                        <i class="fa-solid fa-ban icon-delete" onclick="deactivatePassenger('${p.passenger_id}')"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
            if (replaceUserDropdown) {
                replaceUserDropdown.innerHTML += `<option value="${p.passenger_id}">${p.username}</option>`;
            }
        });
    } catch (error) {
        console.error('Error loading passengers:', error);
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
        
        console.log("Cards loaded into dropdowns:", cards.length);
    } catch (error) {
        console.error('Error loading cards:', error);
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
    document.getElementById('editPassengerForm').scrollIntoView({ behavior: 'smooth' });
};

window.deactivatePassenger = async function(id) {
    if (!confirm('Are you sure you want to deactivate this passenger?')) return;
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/passengers/deactivate/${id}`, { 
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) loadPassengers(); 
    } catch (error) {
        console.error(error);
    }
};