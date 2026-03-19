document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.replace('index.html');
        return; 
    }
    
    loadBusStatus(token);

    // Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchValue = this.value.toUpperCase();
            const tableRows = document.querySelectorAll('#busStatusTableBody tr');
            
            let matchCount = 0; 

            tableRows.forEach(row => {
                if (row.classList.contains('loading-row') || row.id === 'noResultsRow') return;

                const regNoColumn = row.querySelector('td:first-child');
                
                if (regNoColumn) {
                    const regNoText = regNoColumn.textContent || regNoColumn.innerText;
                    
                    if (regNoText.toUpperCase().indexOf(searchValue) > -1) {
                        row.style.display = '';
                        matchCount++; 
                    } else {
                        row.style.display = 'none';
                    }
                }
            });

            const tbody = document.getElementById('busStatusTableBody');
            let noResultsRow = document.getElementById('noResultsRow');

            if (matchCount === 0 && searchValue !== '') {
                if (!noResultsRow) {
                    noResultsRow = document.createElement('tr');
                    noResultsRow.id = 'noResultsRow';
                    noResultsRow.innerHTML = '<td colspan="5" style="text-align: center; color: #666; font-style: italic; padding: 20px;">No buses found matching that registration number.</td>';
                    tbody.appendChild(noResultsRow);
                }
                noResultsRow.style.display = ''; 
            } else if (noResultsRow) {
                noResultsRow.style.display = 'none'; 
            }
        });
    }
});

// Function to fetch and display bus status data
async function loadBusStatus(token) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/bus-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.replace('index.html');
            return;
        }

        const buses = await response.json();
        const tbody = document.getElementById('busStatusTableBody');
        tbody.innerHTML = '';

        if (response.ok) {
            if (buses.length === 0) {
                tbody.innerHTML = '<tr class="loading-row"><td colspan="5">No active buses found.</td></tr>';
                return;
            }

            buses.forEach(bus => {
                let gpsTime = '<span style="color: red;">No Signal</span>';
                if (bus.last_gps_update) {
                    const date = new Date(bus.last_gps_update);
                    gpsTime = date.toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: true 
                    });
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${bus.registration_number || 'N/A'}</strong></td>
                    <td><span style="background: #333; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.9rem;">${bus.route_code || 'Unassigned'}</span></td>
                    <td>${bus.start_location || 'N/A'}</td>
                    <td>${bus.end_location || 'N/A'}</td>
                    <td>${gpsTime}</td>
                    <td>${bus.passenger_count || 0}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr class="loading-row"><td colspan="5" style="text-align: center; color: red;">Error loading bus data.</td></tr>';
        }

    } catch (error) {
        console.error('Network Error:', error);
        document.getElementById('busStatusTableBody').innerHTML = '<tr class="loading-row"><td colspan="5" style="text-align: center; color: red;">Network error occurred. Make sure backend is running.</td></tr>';
    }
}