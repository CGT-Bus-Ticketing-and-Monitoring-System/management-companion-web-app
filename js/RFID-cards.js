let allCards = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        Swal.fire({
            title: 'Unauthorized',
            text: 'You must be logged in to view this page.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    loadCards();

    const searchInput = document.getElementById('searchCardInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            const filteredCards = allCards.filter(card => {
                return card.rfid_uid && card.rfid_uid.toLowerCase().includes(searchTerm);
            });
            
            renderTable(filteredCards);
        });
    }

    const registerForm = document.getElementById('registerCardForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rfidUid = document.getElementById('regRfidUid').value.trim();

            if (!rfidUid) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please enter an RFID UID.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/cards/register`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rfid_uid: rfidUid })
                });

                const result = await res.json();

                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Card Registered Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    registerForm.reset();
                    loadCards(); 
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error registering card',
                        icon: 'error',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                }
            } catch (error) {
                console.error('Registration Error:', error);
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
});

async function loadCards() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/cards`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch cards');

        allCards = await res.json();
        renderTable(allCards);
        
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('cardsTableBody').innerHTML = '<tr class="loading-row"><td colspan="5" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
    }
}

function renderTable(cardsToDisplay) {
    const tbody = document.getElementById('cardsTableBody');
    tbody.innerHTML = '';

    if (cardsToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No matching cards found.</td></tr>';
        return;
    }

    cardsToDisplay.forEach(card => {
        let statusColor = 'green';
        if (card.status === 'BLOCKED') statusColor = 'red';
        if (card.status === 'LOST') statusColor = 'orange';
        if (card.status === 'INACTIVE') statusColor = 'gray';

        let passengerDisplay = card.passenger_name;
        let passengerStyle = card.passenger_name === 'Unassigned' 
            ? 'color: #e74c3c; font-style: italic;' 
            : 'color: #004C82; font-weight: bold;';

        const row = `
            <tr>
                <td>${card.card_id}</td>
                <td>${card.rfid_uid}</td>
                <td style="${passengerStyle}">${passengerDisplay}</td>
                <td><span style="color: ${statusColor}; font-weight: bold;">${card.status}</span></td>
                <td class="action-icons">
                    <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #e74c3c; margin-right: 10px;" 
                       onclick="updateStatus('${card.card_id}', 'BLOCKED')" title="Block Card"></i>
                    <i class="fa-solid fa-check icon-edit" style="cursor: pointer; color: #2ecc71;" 
                       onclick="updateStatus('${card.card_id}', 'ACTIVE')" title="Activate Card"></i>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

window.updateStatus = async function(id, newStatus) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change this card's status to ${newStatus}?`,
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#004C82',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/cards/status/${id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            Swal.fire({
                title: 'Updated!',
                text: `Card status changed to ${newStatus}`,
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadCards(); 
            
            const searchInput = document.getElementById('searchCardInput');
            if (searchInput) searchInput.value = '';
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update card status',
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