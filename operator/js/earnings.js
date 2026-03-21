var earningsData = [];
var earningsChart = null;

function getToken() {
    return localStorage.getItem('operatorToken');
}

function handleDateFilter() {
    var filter = document.getElementById('dateFilter').value;
    fetchEarnings(parseInt(filter));
}

function handleLogout() {
    var confirmLogout = confirm('Are you sure you want to log out?');
    if (confirmLogout) {
        localStorage.removeItem('operatorToken');
        window.location.href = 'index.html';
    }
}

function fetchEarnings(days) {
    var token = getToken();
    if (!token) {
        earningsData = [];
        loadData();
        return;
    }

    const url = `${CONFIG.API_BASE_URL}/operator/earnings?period=last${days}days`;
    
    document.getElementById('earningsTableBody').innerHTML = '<tr><td colspan="5" class="empty-state">Loading...</td></tr>';

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        if (response.status === 401) {
            localStorage.removeItem('operatorToken');
            earningsData = [];
            loadData();
            return null;
        }
        return response.json();
    })
    .then(function(data) {
        earningsData = normalizeEarningsData(data);
        loadData();
    })
    .catch(function(error) {
        document.getElementById('earningsTableBody').innerHTML = `<tr><td colspan="5" class="empty-state">Error connecting to server: ${error.message}</td></tr>`;
    });
}

function normalizeEarningsData(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== 'object') {
        return [];
    }

    if (Array.isArray(data.earnings_by_date)) {
        return data.earnings_by_date;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (Array.isArray(data.rows)) {
        return data.rows;
    }

    return [];
}

function formatDate(dateStr) {
    var d = new Date(dateStr);
    var year = d.getFullYear();
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
}

function loadData() {
    var tableBody = document.getElementById('earningsTableBody');
    var html = '';
    
    if (earningsData.length === 0) {
        html = '<tr><td colspan="5" class="empty-state">No data available</td></tr>';
    } else {
        for (var i = 0; i < earningsData.length; i++) {
            var item = earningsData[i];
            html += '<tr>';
            html += '<td>' + formatDate(item.date) + '</td>';
            html += '<td>' + item.bus + '</td>';
            html += '<td>' + item.route + '</td>';
            html += '<td>' + item.trips_count + '</td>';
            html += '<td>Rs.' + Number(item.total_fares).toFixed(2) + '</td>';
            html += '</tr>';
        }
    }
    
    tableBody.innerHTML = html;
    renderChart();
}

function renderChart() {
    var ctx = document.getElementById('earningsChart').getContext('2d');
    
    // Destroy old chart before creating a new one
    if (earningsChart) {
        earningsChart.destroy();
    }

    var labels = [];
    var fareValues = [];
    var busColors = [];
    var colorMap = {};
    var colorPalette = ['#4A7BA7', '#7BB3E0', '#2c5282', '#5A9BD5', '#3B6FA0', '#8CC4E8'];
    var colorIndex = 0;
    
    for (var i = 0; i < earningsData.length; i++) {
        labels.push(formatDate(earningsData[i].date) + ' - ' + earningsData[i].bus);
        fareValues.push(earningsData[i].total_fares);
        
        var busName = earningsData[i].bus;
        if (!colorMap[busName]) {
            colorMap[busName] = colorPalette[colorIndex % colorPalette.length];
            colorIndex++;
        }
        busColors.push(colorMap[busName]);
    }
    
    earningsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Earnings (Rs)',
                data: fareValues,
                backgroundColor: busColors,
                borderColor: '#2c5282',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs.' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Earnings: Rs.' + context.parsed.y;
                        }
                    }
                }
            }
        }
    });
}

window.onload = function() {
    var filter = document.getElementById('dateFilter').value;
    fetchEarnings(filter);
};
