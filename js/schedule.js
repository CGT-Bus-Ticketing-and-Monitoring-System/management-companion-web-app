let currentSchedules = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.replace('index.html');
        return; 
    }

    loadDropdownOptions(token);
});

// Fetches the Routes and Buses from the database to populate the top dropdowns
async function loadDropdownOptions(token) {
    try {
        const routeResponse = await fetch(`${CONFIG.API_BASE_URL}/routes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (routeResponse.ok) {
            const routes = await routeResponse.json();
            const routeSelect = document.getElementById('routeSelect');
            routeSelect.innerHTML = '<option value="" disabled selected>Select Route</option>';
            routes.forEach(route => {
                routeSelect.innerHTML += `<option value="${route.route_id}">${route.route_code}</option>`;
            });
        }

        const busResponse = await fetch(`${CONFIG.API_BASE_URL}/buses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (busResponse.ok) {
            const buses = await busResponse.json();
            const busSelect = document.getElementById('busSelect');
            busSelect.innerHTML = '<option value="" disabled selected>Select Bus</option>';
            buses.forEach(bus => {
                const displayName = bus.bus_name ? bus.bus_name : `Bus ID: ${bus.bus_id}`;
                busSelect.innerHTML += `<option value="${bus.bus_id}">${displayName}</option>`;
            });
        }

    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }
}

// Helper function to ensure BOTH a route and a bus are selected before searching
function checkAndLoadSchedules() {
    const token = localStorage.getItem('adminToken');
    const routeId = document.getElementById('routeSelect').value;
    const busId = document.getElementById('busSelect').value;
    const tbody = document.getElementById('scheduleTableBody');

    if (!routeId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Please select a route to view its schedule.</td></tr>';
        return;
    }
    if (!busId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Please select a bus to view its schedule.</td></tr>';
        return;
    }

    loadSchedules(routeId, busId, token);
}

// Fetches schedules from the database and builds the HTML table rows
async function loadSchedules(routeId, busId, token) {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading schedules...</td></tr>';

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules/${routeId}/${busId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        currentSchedules = await response.json(); 
        const schedules = currentSchedules;

        tbody.innerHTML = '';

        if (schedules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No schedules found for this route and bus.</td></tr>';
            return;
        }

        schedules.forEach(sched => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sched.departure_time}</td>
                <td>${sched.arrival_time}</td>
                <td>${sched.direction}</td>
                <td>${sched.status}</td>
                <td class="action-icons">
                    <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; margin-right: 10px;" onclick="editSchedule(${sched.schedule_id})"></i>
                    <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: red;" onclick="deleteSchedule(${sched.schedule_id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading data.</td></tr>';
    }
}

// Fired when the "Edit" pencil icon is clicked in the table
window.editSchedule = function(scheduleId) {
    const schedule = currentSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) return;

    document.getElementById('editScheduleId').value = schedule.schedule_id;
    document.getElementById('editDeparture').value = schedule.departure_time;
    document.getElementById('editArrival').value = schedule.arrival_time;
    document.getElementById('editDirection').value = schedule.direction;

    document.getElementById('editScheduleSection').style.display = 'block';
    document.getElementById('editScheduleSection').scrollIntoView({ behavior: 'smooth' });
};

// Fired when the "Delete" trash icon is clicked in the table
window.deleteSchedule = async function(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) {
        return; 
    }

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Schedule deleted!');
            const currentRouteId = document.getElementById('routeSelect').value;
            const currentBusId = document.getElementById('busSelect').value;

            loadSchedules(currentRouteId, currentBusId, token);
        } else {
            alert('Failed to delete schedule.');
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
    }
};

// Listen for Dropdown Changes
document.getElementById('routeSelect').addEventListener('change', checkAndLoadSchedules);
document.getElementById('busSelect').addEventListener('change', checkAndLoadSchedules);

// Listen for the "Add Schedule" Form Submission
document.getElementById('addScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const busId = document.getElementById('busSelect').value;
    const routeId = document.getElementById('routeSelect').value; 

    if (!busId || !routeId) {
        alert('Please select both a Route and a Bus from the top section first!');
        return;
    }

    const scheduleData = {
        bus_id: busId,
        route_id: routeId, 
        departure_time: document.getElementById('addDeparture').value,
        arrival_time: document.getElementById('addArrival').value,
        direction: document.getElementById('addDirection').value,
        status: 'ACTIVE' 
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(scheduleData)
        });

        if (response.ok) {
            alert('Schedule added successfully!');
            document.getElementById('addScheduleForm').reset();
            loadSchedules(routeId, busId, token);
        } else {
            alert('Failed to add schedule.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Listen for the "Edit Schedule" Form Submission
document.getElementById('editScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const scheduleId = document.getElementById('editScheduleId').value;
    const currentRouteId = document.getElementById('routeSelect').value;
    const currentBusId = document.getElementById('busSelect').value;

    const updatedData = {
        departure_time: document.getElementById('editDeparture').value,
        arrival_time: document.getElementById('editArrival').value,
        direction: document.getElementById('editDirection').value
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules/${scheduleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('Schedule updated successfully!');
            document.getElementById('editScheduleSection').style.display = 'none';
            loadSchedules(currentRouteId, currentBusId, token);
        } else {
            alert('Failed to update schedule.');
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
    }
});

// Listen for the "Cancel" button on the Edit Form
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editScheduleForm').reset();
    document.getElementById('editScheduleSection').style.display = 'none';
});