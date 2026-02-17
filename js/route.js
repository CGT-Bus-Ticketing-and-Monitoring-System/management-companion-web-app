document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
    loadAssignmentDropdowns();

    const createForm = document.getElementById('createRouteForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                route_code: document.getElementById('createCode').value,
                start_location: document.getElementById('createStart').value,
                end_location: document.getElementById('createEnd').value,
                base_fare: document.getElementById('createFare').value
            };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (res.ok) {
                    alert('Route Created Successfully!');
                    createForm.reset();
                    loadRoutes();
                    loadAssignmentDropdowns();
                } else {
                    alert(result.message || 'Error creating route');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
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
                alert("Please select both a Route and a Bus.");
                return;
            }

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/assign-bus`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ route_id: routeId, bus_reg_no: busReg })
                });

                const result = await res.json();
                if (res.ok) {
                    alert('Bus Assigned Successfully!');
                    assignForm.reset();
                    loadRoutes(); 
                } else {
                    alert(result.message || 'Error assigning bus');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
            }
        });
    }

    const editForm = document.getElementById('editRouteForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editRouteId').value;
            const data = {
                start_location: document.getElementById('editStart').value,
                end_location: document.getElementById('editEnd').value,
                base_fare: document.getElementById('editFare').value
            };

            try {
                const res = await fetch(`${CONFIG.API_BASE_URL}/routes/update/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();
                if (res.ok) {
                    alert('Route Updated!');
                    loadRoutes();
                    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(result.message || 'Update failed');
                }
            } catch (error) {
                console.error(error);
                alert('Connection Error');
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
        console.error('Error loading routes:', error);
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
    if(!confirm('Are you sure you want to deactivate this route?')) return;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/routes/deactivate/${id}`, { method: 'PUT' });
        if (res.ok) {
            loadRoutes();
        } else {
            alert('Failed to deactivate route');
        }
    } catch (error) {
        console.error(error);
    }
};

window.setupEdit = function(id, start, end, fare) {
    document.getElementById('editRouteId').value = id;
    document.getElementById('editStart').value = start;
    document.getElementById('editEnd').value = end;
    document.getElementById('editFare').value = fare;

    document.getElementById('editRouteForm').scrollIntoView({ behavior: 'smooth' });
};