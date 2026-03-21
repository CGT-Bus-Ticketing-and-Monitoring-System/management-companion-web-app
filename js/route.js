document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
    loadAssignmentDropdowns();

    const createForm = document.getElementById('createRouteForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const route_code = document.getElementById('createCode').value.trim();
            const start_location = document.getElementById('createStart').value.trim();
            const end_location = document.getElementById('createEnd').value.trim();
            const base_fare = document.getElementById('createFare').value.trim();

            if (!route_code || !start_location || !end_location || !base_fare) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please fill in all fields.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            if (!/^\d+$/.test(route_code)) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Route code must be a number only.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const data = { route_code, start_location, end_location, base_fare };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Route Created Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    createForm.reset();
                    loadRoutes();
                    loadAssignmentDropdowns();
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error creating route',
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

    const assignForm = document.getElementById('assignBusForm');
    if (assignForm) {
        assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const routeId = document.getElementById('assignRouteSelect').value;
            const busReg = document.getElementById('assignBusSelect').value;

            if (!routeId || !busReg) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please select both a Route and a Bus.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/assign-bus`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ route_id: routeId, bus_reg_no: busReg })
                });

                const result = await res.json();
                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Bus Assigned Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    assignForm.reset();
                    loadRoutes(); 
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Error assigning bus',
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

    const editForm = document.getElementById('editRouteForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editRouteId').value;
            const start_location = document.getElementById('editStart').value.trim();
            const end_location = document.getElementById('editEnd').value.trim();
            const base_fare = document.getElementById('editFare').value.trim();

            if (!start_location || !end_location || !base_fare) {
                return Swal.fire({
                    title: 'Validation Error',
                    text: 'Please fill in all fields.',
                    icon: 'warning',
                    iconColor: '#004C82',
                    confirmButtonColor: '#004C82'
                });
            }

            const data = { start_location, end_location, base_fare };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/update/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Route Updated Successfully!',
                        icon: 'success',
                        iconColor: '#004C82',
                        confirmButtonColor: '#004C82'
                    });
                    document.getElementById('editRouteSection').style.display = 'none';
                    loadRoutes();
                    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
                } else {
                    const result = await res.json();
                    Swal.fire({
                        title: 'Error',
                        text: result.message || 'Update failed',
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
});

async function loadRoutes() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/routes`);
        const routes = await res.json();
        
        const tbody = document.querySelector('.routes-table tbody');
        tbody.innerHTML = '';

        if (routes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No active routes found.</td></tr>';
            return;
        }

        routes.forEach(r => {
            const row = `
                <tr>
                    <td>${r.route_code}</td>
                    <td>${r.start_location}</td>
                    <td>${r.end_location}</td>
                    <td>${parseFloat(r.base_fare).toFixed(2)}</td>
                    <td><span style="color: green; font-weight: bold;">${r.status}</span></td>
                    <td>${r.assigned_buses}</td>
                    <td class="action-icons">
                        <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #3498db; margin-right: 10px;" 
                           onclick="setupEdit('${r.route_id}', '${r.start_location}', '${r.end_location}', '${r.base_fare}')"></i>
                        <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: #e74c3c;" 
                           onclick="deactivateRoute('${r.route_id}')"></i>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('routeTableBody').innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
    }
}

async function loadAssignmentDropdowns() {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/routes/assignment-data`);
        const data = await res.json();

        const routeSelect = document.getElementById('assignRouteSelect');
        const busSelect = document.getElementById('assignBusSelect');

        routeSelect.innerHTML = '<option value="">Select Route</option>';
        data.routes.forEach(r => {
            routeSelect.innerHTML += `<option value="${r.route_id}">${r.route_code} (${r.start_location} - ${r.end_location})</option>`;
        });

        busSelect.innerHTML = '<option value="">Select Bus</option>';
        data.buses.forEach(b => {
            busSelect.innerHTML += `<option value="${b.registration_number}">${b.registration_number}</option>`;
        });

    } catch (error) {
        console.error('Error loading dropdowns:', error);
    }
}

window.deactivateRoute = async function(id) {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to deactivate this route?",
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, deactivate it!'
    });

    if (!confirmation.isConfirmed) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/routes/deactivate/${id}`, { method: 'PUT' });
        if (res.ok) {
            Swal.fire({
                title: 'Deactivated!',
                text: 'Route has been deactivated.',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            loadRoutes();
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to deactivate route',
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
};

window.setupEdit = function(id, start, end, fare) {
    document.getElementById('editRouteId').value = id;
    document.getElementById('editStart').value = start;
    document.getElementById('editEnd').value = end;
    document.getElementById('editFare').value = fare;

    const editSection = document.getElementById('editRouteSection');
    editSection.style.display = 'block';    
    editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editRouteForm').reset();
    document.getElementById('editRouteSection').style.display = 'none';
});