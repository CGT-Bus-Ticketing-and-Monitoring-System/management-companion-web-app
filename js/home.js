document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = 'index.html';
        return; 
    }

    const adminName = localStorage.getItem('adminFName') || 'Admin';
    const welcomeElement = document.getElementById('welcomeText');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${adminName}!`;
    }

    loadDashboardStats(token);
});

async function loadDashboardStats(token) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/dashboard-stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('adminToken'); 
            window.location.href = 'index.html';
            return;
        }

        const stats = await response.json();

        if (response.ok) {
            document.getElementById('activeBusesCount').textContent = stats.active_buses || 0;
            document.getElementById('offlineBusesCount').textContent = stats.offline_buses || 0;
            document.getElementById('totalPassengersCount').textContent = stats.total_passengers || 0;
            document.getElementById('tripsTodayCount').textContent = stats.trips_today || 0;
        } else {
            console.error('Failed to load stats:', stats.message);
        }

    } catch (error) {
        console.error('Network Error:', error);
    }
}