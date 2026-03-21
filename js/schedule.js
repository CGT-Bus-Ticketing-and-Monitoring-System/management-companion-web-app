let currentSchedules = [];
let allBuses = []; 

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
            window.location.replace('index.html');
        });
        return; 
    }

    loadDropdownOptions(token);
});

// Fetches the Routes and Buses from the database
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
            allBuses = await busResponse.json(); // Store all buses in memory
            const busSelect = document.getElementById('busSelect');
            // Tell user to select route first
            busSelect.innerHTML = '<option value="" disabled selected>Select a Route First</option>'; 
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to load dropdown options.',
            icon: 'error',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }
}

// When Route is selected: Filter buses dropdown AND load the table
document.getElementById('routeSelect').addEventListener('change', () => {
    const token = localStorage.getItem('adminToken');
    const routeId = document.getElementById('routeSelect').value;
    
    if (routeId) {
        // 1. Filter the Bus Dropdown based on the selected route
        const busSelect = document.getElementById('busSelect');
        busSelect.innerHTML = '<option value="" disabled selected>Select Bus for New Schedule</option>';
        
        const filteredBuses = allBuses.filter(bus => bus.route_id == routeId);
        
        if (filteredBuses.length === 0) {
            busSelect.innerHTML += `<option value="" disabled>No buses assigned to this route</option>`;
        } else {
            filteredBuses.forEach(bus => {
                busSelect.innerHTML += `<option value="${bus.bus_id}">${bus.registration_number}</option>`;
            });
        }

        // 2. Load the Schedule Table
        loadSchedules(routeId, token);
    }
});

// Fetches schedules from the database by Route ID
async function loadSchedules(routeId, token) {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading schedules...</td></tr>';

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules/route/${routeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch schedules');

        currentSchedules = await response.json(); 
        const schedules = currentSchedules;

        tbody.innerHTML = '';

        if (schedules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No schedules found for this route.</td></tr>';
            return;
        }

        schedules.forEach(sched => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold; color: #004C82;">${sched.registration_number || 'Unknown'}</td>
                <td>${sched.departure_time}</td>
                <td>${sched.arrival_time}</td>
                <td>${sched.direction}</td>
                <td>${sched.status}</td>
                <td class="action-icons">
                    <i class="fa-solid fa-pen-to-square icon-edit" style="cursor: pointer; color: #004C82; margin-right: 15px; font-size: 1.1rem;" onclick="editSchedule(${sched.schedule_id})"></i>
                    <i class="fa-solid fa-ban icon-delete" style="cursor: pointer; color: red;" onclick="deleteSchedule(${sched.schedule_id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('scheduleTableBody').innerHTML = '<tr class="loading-row"><td colspan="7" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
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
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this schedule?",
        icon: 'warning',
        iconColor: '#004C82',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#004C82',
        confirmButtonText: 'Yes, delete it!'
    });

    if (!confirmation.isConfirmed) return;

    const token = localStorage.getItem('adminToken');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/schedules/${scheduleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            Swal.fire({
                title: 'Deleted!',
                text: 'Schedule deleted successfully!',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            const currentRouteId = document.getElementById('routeSelect').value;
            loadSchedules(currentRouteId, token);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to delete schedule.',
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

// Listen for the "Add Schedule" Form Submission
document.getElementById('addScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const busId = document.getElementById('busSelect').value;
    const routeId = document.getElementById('routeSelect').value; 

    if (!busId || !routeId) {
        return Swal.fire({
            title: 'Validation Error',
            text: 'Please select both a Route and a Bus from the top section first!',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }

    const departure_time = document.getElementById('addDeparture').value.trim();
    const arrival_time = document.getElementById('addArrival').value.trim();
    const direction = document.getElementById('addDirection').value.trim();

    if (!departure_time || !arrival_time || !direction) {
        return Swal.fire({
            title: 'Validation Error',
            text: 'Please fill in all schedule details.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }

    const scheduleData = {
        bus_id: busId,
        route_id: routeId, 
        departure_time: departure_time,
        arrival_time: arrival_time,
        direction: direction,
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
            Swal.fire({
                title: 'Success!',
                text: 'Schedule added successfully!',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            document.getElementById('addScheduleForm').reset();
            loadSchedules(routeId, token);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to add schedule.',
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

// Listen for the "Edit Schedule" Form Submission
document.getElementById('editScheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const scheduleId = document.getElementById('editScheduleId').value;
    const currentRouteId = document.getElementById('routeSelect').value;

    const departure_time = document.getElementById('editDeparture').value.trim();
    const arrival_time = document.getElementById('editArrival').value.trim();
    const direction = document.getElementById('editDirection').value.trim();

    if (!departure_time || !arrival_time || !direction) {
        return Swal.fire({
            title: 'Validation Error',
            text: 'Please fill in all schedule details.',
            icon: 'warning',
            iconColor: '#004C82',
            confirmButtonColor: '#004C82'
        });
    }

    const updatedData = {
        departure_time: departure_time,
        arrival_time: arrival_time,
        direction: direction
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
            Swal.fire({
                title: 'Success!',
                text: 'Schedule updated successfully!',
                icon: 'success',
                iconColor: '#004C82',
                confirmButtonColor: '#004C82'
            });
            document.getElementById('editScheduleSection').style.display = 'none';
            loadSchedules(currentRouteId, token);
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update schedule.',
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

// Listen for the "Cancel" button on the Edit Form
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editScheduleForm').reset();
    document.getElementById('editScheduleSection').style.display = 'none';
});