document.addEventListener('DOMContentLoaded', () => {
    const operatorId = localStorage.getItem('operatorId') || localStorage.getItem('operator_id');
    const token = localStorage.getItem('operatorToken');

    if (!operatorId || !token) {
    window.location.replace('../index.html'); 
    return;
    }

    fetchBuses(operatorId);
});

async function fetchBuses(id) {
    const busContainer = document.getElementById('busContainer');
    
    try {
        busContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; width: 100%;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #004C82; margin-bottom: 10px;"></i>
                <p style="color: #64748b; font-weight: 500;">Loading your fleet...</p>
            </div>
        `;

        const response = await fetch(`${CONFIG.API_BASE_URL}/operator/my-buses/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        busContainer.innerHTML = '';

        if (data.length === 0) {
            busContainer.innerHTML = '<p class="no-data">No buses found for your account.</p>';
            return;
        }

        data.forEach(bus => {
            const statusClass = bus.status === 'ACTIVE' ? 'status-active' : 'status-inactive';
            
            const safeName = bus.bus_name ? String(bus.bus_name).replace(/'/g, "\\'").replace(/"/g, "&quot;") : '';
            const safeModel = bus.model ? String(bus.model).replace(/'/g, "\\'").replace(/"/g, "&quot;") : '';
            const safeReg = bus.registration_number ? String(bus.registration_number).replace(/'/g, "\\'").replace(/"/g, "&quot;") : '';

            busContainer.innerHTML += `
                <div class="bus-card">
                    <div class="card-left">
                        <i class="fa-solid fa-bus bus-icon"></i>
                        <div class="bus-details">
                            <h3>${bus.bus_name}</h3>
                            <p><strong>Route code:</strong> <strong style="color: #1992ad">${bus.route ?? 'Unassigned'}</strong></p>
                            <p><strong>Reg No:</strong> ${bus.registration_number}</p>
                            <p><strong>Model:</strong> ${bus.model}</p>
                            <p><strong>Capacity:</strong> ${bus.capacity} Seats</p>
                        </div>
                    </div>
                    <div class="card-right">
                        <div class="status-badge ${statusClass}">${bus.status}</div>
                        <div class="action-icons">
                            <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;" title="Edit" onclick="openEditModal(${bus.bus_id}, '${safeName}', '${safeModel}', '${safeReg}', ${bus.capacity})"></i>
                            <i class="fa-solid fa-trash delete-icon" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;" title="Delete" onclick="deleteBus(${bus.bus_id})"></i>
                            
                            ${bus.status === 'ACTIVE' 
                                ? `<i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #e74c3c; font-size: 1.1rem;" title="Deactivate Bus" onclick="updateStatus(${bus.bus_id}, 'INACTIVE')"></i>` 
                                : `<i class="fa-solid fa-check icon-edit" style="cursor: pointer; color: #2ecc71; font-size: 1.1rem;" title="Activate Bus" onclick="updateStatus(${bus.bus_id}, 'ACTIVE')"></i>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error fetching data:", err);

        busContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; width: 100%; background: #ffffff; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <i class="fa-solid fa-server" style="font-size: 3rem; color: #64748b; margin-bottom: 15px;"></i>
                <h3 style="color: #64748b; font-size: 1.4rem; margin-bottom: 8px;">Connection Failed</h3>
                <p style="color: #64748b; font-size: 1rem;">Unable to load your fleet data. Please check your backend server connection.</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    <i class="fa-solid fa-rotate-right" style="margin-right: 8px;"></i> Try Again
                </button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchCardInput');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            const cards = document.querySelectorAll('.bus-card');

            cards.forEach(card => {
                const busName = card.querySelector('h3').textContent.toLowerCase();
                
                if (busName.includes(term)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
window.deleteBus = async function(busId) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you really want to delete this bus?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, delete it!',
        iconColor: '#004C82'
    });

    if (confirmation.isConfirmed) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/operator/delete-bus/${busId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Bus deleted successfully!',
                    icon: 'success',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                }).then(() => {
                    location.reload(); 
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Could not delete the bus.',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire({
                title: 'Connection Error',
                text: 'Could not connect to the server.',
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    }
}

const modal = document.getElementById('createBusModal');
const createBtn = document.getElementById('createBusBtn');
const closeBtn = document.getElementById('closeModalBtn');
const createForm = document.getElementById('createBusForm');

if (createBtn) {
    createBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

if (createForm) {
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentId = localStorage.getItem('operatorId') || localStorage.getItem('operator_id');
        const busName = document.getElementById('busName').value.trim();
        const busModel = document.getElementById('busModel').value.trim();
        const regNo = document.getElementById('regNo').value.trim();
        const capacity = document.getElementById('capacity').value.trim();

        if (!busName || !busModel || !regNo || !capacity) {
            return Swal.fire({
                title: 'Validation Error',
                text: 'Please fill in all required fields.',
                icon: 'warning',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }

        if (isNaN(capacity) || parseInt(capacity) <= 0) {
            return Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter a valid capacity.',
                icon: 'warning',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }

        const busData = {
            bus_name: busName,
            model: busModel,
            registration_number: regNo,
            capacity: parseInt(capacity, 10),
            operator_id: currentId,
            status: 'ACTIVE'
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/operator/create-bus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(busData)
            });

            if (response.ok) {
                modal.style.display = 'none'; 
                Swal.fire({
                    title: 'Success!',
                    text: 'Bus added successfully!',
                    icon: 'success',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                }).then(() => {
                    createForm.reset();
                    location.reload();
                });
            } else {

                const errorData = await response.json();
                console.log("Server error data:", errorData); 
                
                Swal.fire({
                    title: 'Duplicate Found',
                    text: errorData.message || 'A bus with this registration number already exists.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        } catch (error) {
            console.error("Submission error:", error);
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

let currentEditBusId = null;
const editModal = document.getElementById('editBusModal');
const closeEditBtn = document.getElementById('closeEditModalBtn');
const editForm = document.getElementById('editBusForm');

window.openEditModal = function(busId, name, model, regNo, capacity) {
    currentEditBusId = busId;
    
    document.getElementById('editBusName').value = name || '';
    document.getElementById('editBusModel').value = model || '';
    document.getElementById('editRegNo').value = regNo || '';
    document.getElementById('editCapacity').value = capacity || '';
    
    if(editModal) {
        editModal.style.display = 'flex';
    }
};

if (closeEditBtn) {
    closeEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        currentEditBusId = null;
    });
}

window.addEventListener('click', (event) => {
    if (event.target == editModal) {
        editModal.style.display = 'none';
        currentEditBusId = null;
    }
});

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentEditBusId) return;

        const token = localStorage.getItem('operatorToken');
        if (!token) {
            Swal.fire({
                title: 'Unauthorized',
                text: 'Authentication error. Please login again.',
                icon: 'warning',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            return;
        }

        const busName = document.getElementById('editBusName').value.trim();
        const busModel = document.getElementById('editBusModel').value.trim();
        const regNo = document.getElementById('editRegNo').value.trim();
        const capacity = document.getElementById('editCapacity').value.trim();

        if (!busName || !busModel || !regNo || !capacity) {
            return Swal.fire({
                title: 'Validation Error',
                text: 'Please fill in all required fields.',
                icon: 'warning',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }

        if (isNaN(capacity) || parseInt(capacity) <= 0) {
            return Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter a valid capacity.',
                icon: 'warning',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }

        const updatedData = {
            bus_name: busName,
            model: busModel,
            registration_number: regNo,
            capacity: parseInt(capacity, 10)
        };

        try {
            const response = await fetch(CONFIG.API_BASE_URL + '/operator/update-bus/' + currentEditBusId, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                editModal.style.display = 'none'; 
                Swal.fire({
                    title: 'Success!',
                    text: 'Bus updated successfully!',
                    icon: 'success',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                }).then(() => {
                    location.reload();
                });
            } else {
                const data = await response.json();
                Swal.fire({
                    title: 'Error',
                    text: data.message || data.error || 'Could not update the bus. Registration number might already exist.',
                    icon: 'error',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }
        } catch (error) {
            console.error('Update error:', error);
            Swal.fire({
                title: 'Connection Error',
                text: 'Network error updating bus.',
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    });
}

window.updateStatus = async function(busId, newStatus) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change this bus status to ${newStatus}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#004C82',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
        iconColor: '#004C82'
    });

    if (!confirmation.isConfirmed) return;

    const token = localStorage.getItem('operatorToken'); 
    
    if (!token) {
        Swal.fire({
            title: 'Unauthorized',
            text: 'Authentication error. Please login again.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/operator/update-bus-status/${busId}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            Swal.fire({
                title: 'Updated!',
                text: `Bus status changed to ${newStatus}`,
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            }).then(() => {
                 const operatorId = localStorage.getItem('operatorId') || localStorage.getItem('operator_id');
                 fetchBuses(operatorId); 
            });
        } else {
            const data = await response.json();
            Swal.fire({
                title: 'Error',
                text: data.message || 'Failed to update status',
                icon: 'error',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
        }
    } catch (error) {
        console.error('Status Update Error:', error);
        Swal.fire({
            title: 'Connection Error',
            text: 'Network error updating bus status. Check terminal for server crashes!',
            icon: 'error',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }
};

