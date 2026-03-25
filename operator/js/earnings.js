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
        window.location.href = '../index.html';
    }
}

function normalizeEarningsData(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.earnings_by_date)) return data.earnings_by_date;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.rows)) return data.rows;
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
            html += '<td>' + (item.bus || 'N/A') + '</td>';
            html += '<td>' + (item.route || 'N/A') + '</td>';
            html += '<td>' + (item.trips_count || 0) + '</td>';
            html += '<td>Rs.' + Number(item.total_fares || 0).toFixed(2) + '</td>';
            html += '</tr>';
        }
    }
    
    tableBody.innerHTML = html;
    renderChart();
}

function renderChart() {
    var chartCanvas = document.getElementById('earningsChart');
    if (!chartCanvas) return;

     var ctx = chartCanvas.getContext('2d');
    if (earningsChart) earningsChart.destroy();

    var chartContainer = chartCanvas.parentElement;
    var msgElement = chartContainer.querySelector('.no-data-msg');

    if (!earningsData || earningsData.length === 0) {
    chartCanvas.style.display = 'none'; 

    if (!msgElement) {
            msgElement = document.createElement('div');
            msgElement.className = 'no-data-msg';
            msgElement.style.cssText = 'height: 100%; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center;';
            chartContainer.appendChild(msgElement);
        }

        msgElement.innerHTML = `
            <i class="fa-solid fa-chart-bar" style="font-size: 2.5rem; margin-bottom: 15px; color: #cbd5e1;"></i>
             <span style="font-size: 1.1rem; font-weight: 700; color: #64748b;">No Data Available</span>
            <span style="font-size: 0.9rem; margin-top: 4px;">There are no earnings for the selected period.</span>
         `;
        msgElement.style.display = 'flex';
        return; 
    }

    chartCanvas.style.display = 'block';
    if (msgElement) msgElement.style.display = 'none';

    var labels = [];
    var fareValues = [];
    var busColors = [];
    var colorMap = {};
    var colorPalette = ['#004C82', '#004C82', '#004C82', '#004C82', '#004C82', '#004C82'];
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
        borderRadius: 5
            }]
         },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
    y: { beginAtZero: true }
    }
     }
    });
}

async function fetchEarnings(days) {
    var token = getToken();
    if (!token) {
        window.location.replace('../index.html');
        return;
    }


    const endDateObj = new Date();
    const startDateObj = new Date();
    

    if (days === 7) {
        startDateObj.setDate(endDateObj.getDate() - 6);
    } else if (days === 30) {
        startDateObj.setDate(endDateObj.getDate() - 29);
    } else if (days !== 1) {

        startDateObj.setDate(endDateObj.getDate() - (days - 1));
    }

    const formatLocal = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    const fromDate = formatLocal(startDateObj);
    const toDate = formatLocal(endDateObj);

    const baseUrl = CONFIG.API_BASE_URL.endsWith('/') ? CONFIG.API_BASE_URL.slice(0, -1) : CONFIG.API_BASE_URL;

    const url = `${baseUrl}/operator/earnings?fromDate=${fromDate}&toDate=${toDate}`;

    const tableBody = document.getElementById('earningsTableBody');
    const ctxTraffic = document.getElementById('earningsChart');
    
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
    
    if (ctxTraffic) {
        ctxTraffic.style.display = 'block'; 
        const msg = ctxTraffic.parentElement.querySelector('.no-data-msg');
        if (msg) msg.style.display = 'none';
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('operatorToken');
            window.location.href = '../index.html';
            return;
        }

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        earningsData = normalizeEarningsData(data);
        loadData();

    } catch (error) {
        console.error("Fetch Error:", error);

        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 50px; color: #64748b;"><i class="fa-solid fa-server"></i> Connection Failed</td></tr>`;

        if (ctxTraffic) {
            ctxTraffic.style.display = 'none'; 
            const trafficContainer = ctxTraffic.parentElement;
            
            let msg = trafficContainer.querySelector('.no-data-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'height: 100%; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center;';
                trafficContainer.appendChild(msg);
            }
            
            msg.innerHTML = `
                <i class="fa-solid fa-server" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                <span style="font-size: 1.1rem; font-weight: 700; color: #64748b;">Connection Failed</span>
                <span style="font-size: 0.9rem; margin-top: 4px;">Unable to load chart data</span>
            `;
            msg.style.display = 'flex';
        }
    }
}

window.onload = function() {
    var filterEl = document.getElementById('dateFilter');
    var filterValue = filterEl ? filterEl.value : 30;
    fetchEarnings(filterValue);
};