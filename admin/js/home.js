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
    initHomePageCharts(token);

    const timeRangeSelector = document.getElementById('timeRangeSelector');
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', () => {
            const selectedDays = timeRangeSelector.value;
            const token = localStorage.getItem('adminToken');
            
            let daysValue = 30;
            if (selectedDays === 'today') daysValue = 1;
            else if (selectedDays === '7days') daysValue = 7;
            else if (selectedDays === '30days') daysValue = 30;

            initHomePageCharts(token, daysValue);
        });
    }
});

async function loadDashboardStats(token) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/dashboard-stats`, {
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

let homeTrafficChart = null;
let homeStatusChart = null;

async function initHomePageCharts(token, days = 30) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/reports/summary?days=${days}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;
        const data = await response.json();
        const { periodAnalytics, rushHourStats } = data;

        // Line Chart (Passenger Traffic)
        const ctxTraffic = document.getElementById('trafficChart');
        const trafficContainer = ctxTraffic.parentElement;
        const totalPassengers = rushHourStats.data.reduce((a, b) => a + b, 0);

        if (totalPassengers === 0) {
            ctxTraffic.style.display = 'none';
            let msg = trafficContainer.querySelector('.no-data-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.9rem; font-style: italic;';
                trafficContainer.appendChild(msg);
            }
            msg.textContent = "No traffic data available";
            msg.style.display = 'flex';
        } else {
            ctxTraffic.style.display = 'block';
            const msg = trafficContainer.querySelector('.no-data-msg');
            if (msg) msg.style.display = 'none';

            if (homeTrafficChart) homeTrafficChart.destroy();
            homeTrafficChart = new Chart(ctxTraffic.getContext('2d'), {
                type: 'line',
                data: {
                    labels: rushHourStats.labels,
                    datasets: [{
                        label: 'Passengers',
                        data: rushHourStats.data,
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    animation: {
                        y: {
                            duration: 2000,
                            delay: 300, 
                            easing: 'easeOut' 
                        },
                        colors: {
                            type: 'color',
                            duration: 1000,
                            from: 'transparent' 
                        }
                    }
                }
            });
        }

        // Doughnut Chart (Operational Status)
        const ctxStatus = document.getElementById('tripStatusChart');
        const statusContainer = ctxStatus.parentElement;
        const totalTrips = (periodAnalytics.completedTrips || 0) + (periodAnalytics.cancelledTrips || 0);

        if (totalTrips === 0) {
            ctxStatus.style.display = 'none';
            let msg = statusContainer.querySelector('.no-data-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'height: 100%; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.9rem; font-style: italic;';
                statusContainer.appendChild(msg);
            }
            msg.textContent = "No operational data available";
            msg.style.display = 'flex';
        } else {
            ctxStatus.style.display = 'block';
            const msg = statusContainer.querySelector('.no-data-msg');
            if (msg) msg.style.display = 'none';

            if (homeStatusChart) homeStatusChart.destroy();

            homeStatusChart = new Chart(ctxStatus.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Cancelled'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#10b981', '#f59e0b'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { display: false } },
                    animation: {
                        duration: 1500, 
                        easing: 'easeOut' 
                    }
                }
            });
            setTimeout(() => {
                homeStatusChart.data.datasets[0].data = [
                    periodAnalytics.completedTrips, 
                    periodAnalytics.cancelledTrips
                ];
                homeStatusChart.update(); 
            }, 600); 
        }

        const statsGrid = document.getElementById('performanceStats');
        statsGrid.innerHTML = `
            <div class="premium-stat-item">
                <span class="stat-label">Commenced</span>
                <div class="stat-val color-dark">${periodAnalytics.totalTrips || 0}</div>
            </div>
            <div class="premium-stat-item">
                <span class="stat-label">Completed</span>
                <div class="stat-val color-green">${periodAnalytics.completedTrips || 0}</div>
            </div>
            <div class="premium-stat-item">
                <span class="stat-label">Cancelled</span>
                <div class="stat-val color-amber">${periodAnalytics.cancelledTrips || 0}</div>
            </div>
            <div class="premium-stat-item">
                <span class="stat-label">New Users</span>
                <div class="stat-val color-sky">${periodAnalytics.newPassengers || 0}</div>
            </div>
        `;

    } catch (err) {
        console.error("Home chart error:", err);
        
        // Handle Traffic Chart Error State
        const ctxTraffic = document.getElementById('trafficChart');
        if (ctxTraffic) {
            ctxTraffic.style.display = 'none';
            const trafficContainer = ctxTraffic.parentElement;
            let msg = trafficContainer.querySelector('.no-data-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center;';
                trafficContainer.appendChild(msg);
            }
            msg.innerHTML = `
                <i class="fa-solid fa-server" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <span style="font-size: 0.95rem; font-weight: 600; color: #64748b;">Connection Failed</span>
                <span style="font-size: 0.85rem; margin-top: 4px;">Unable to load traffic data</span>
            `;
            msg.style.display = 'flex';
        }

        // Handle Doughnut Chart Error State
        const ctxStatus = document.getElementById('tripStatusChart');
        if (ctxStatus) {
            ctxStatus.style.display = 'none';
            const statusContainer = ctxStatus.parentElement;
            let msgStatus = statusContainer.querySelector('.no-data-msg');
            if (!msgStatus) {
                msgStatus = document.createElement('div');
                msgStatus.className = 'no-data-msg';
                msgStatus.style.cssText = 'height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center;';
                statusContainer.appendChild(msgStatus);
            }
            msgStatus.innerHTML = `
                <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <span style="font-size: 0.95rem; font-weight: 600; color: #64748b;">Data Unavailable</span>
            `;
            msgStatus.style.display = 'flex';
        }

    }
}

//Report Generation Modal Logic
const generateBtn = document.querySelector('.generate-btn');
const reportModal = document.getElementById('reportModal');
const closeIconBtn = document.getElementById('closeIconBtn');
const closeModalBtn = document.getElementById('closeModalBtn'); 
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

let reportChartInstance = null; 
let peakHoursChartInstance = null;

// Event Listeners for Modal Open/Close
generateBtn.addEventListener('click', async () => {
    const daysSelect = document.getElementById('date-range');
    const days = daysSelect.value;
    const daysText = daysSelect.options[daysSelect.selectedIndex].text;
    const token = localStorage.getItem('adminToken'); 

    reportModal.style.display = 'flex';
    document.getElementById('reportDateRange').innerText = `Timeframe: ${daysText} | Generated: ${new Date().toLocaleDateString()}`;
    
    // Display a loading spinner while waiting for the asynchronous fetch request
    document.getElementById('reportDataContainer').innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Fetching report data...</p>
        </div>
    `;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/reports/summary?days=${days}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } 
        });

        if (!response.ok) throw new Error('Failed to fetch report data');

        const data = await response.json();
        const { periodAnalytics, systemSnapshot, rushHourStats } = data;

        // Calculate the percentage of successful trips
        const totalResolvedTrips = periodAnalytics.completedTrips + periodAnalytics.cancelledTrips;
        const completionRate = totalResolvedTrips > 0 
            ? Math.round((periodAnalytics.completedTrips / totalResolvedTrips) * 100) 
            : 0;

        // Handle Rush Hour labels (AM/PM) and data points
        const hourlyLabels = rushHourStats ? rushHourStats.labels : [
            '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', 
            '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
        ];
        const passengerData = rushHourStats ? rushHourStats.data : [
            40, 120, 350, 580, 400, 210, 150, 190, 
            180, 200, 280, 410, 620, 550, 300, 180, 90, 40
        ];

        // Find the Peak Hour and period type (Morning/Evening)
        const maxPassengers = Math.max(...passengerData);
        const totalPassengers = passengerData.reduce((a, b) => a + b, 0);
        let insightsHTML = '';

        if (totalPassengers > 0) {
            const peakIndex = passengerData.indexOf(maxPassengers);
            const peakHourLabel = hourlyLabels[peakIndex];
            const isMorningPeak = peakIndex < hourlyLabels.indexOf('12 PM');
            const periodType = isMorningPeak ? "Morning Commute" : "Evening Rush";
            const avgPassengers = Math.round(totalPassengers / passengerData.length);

            insightsHTML = `
                <div style="margin: 0 auto; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
                    <h5 style="color: #1e40af; margin: 0 0 10px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Rush Hour Insights</h5>
                    <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 0.9rem; line-height: 1.6;">
                        <li>Peak demand was identified at ${peakHourLabel} with ${maxPassengers} completions.</li>
                        <li>The system detected a significant ${periodType} spike.</li>
                        <li>Average throughput: ${avgPassengers} passengers per hour.</li>
                    </ul>
                </div>
            `;
        } else {
            insightsHTML = `
                <div style="margin: 0 auto; padding: 15px; background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 4px;">
                    <h5 style="color: #854d0e; margin: 0 0 5px 0; font-size: 0.85rem; text-transform: uppercase;">System Note</h5>
                    <p style="margin: 0; color: #713f12; font-size: 0.9rem;">No passenger activity recorded for this timeframe. Insights will appear once trips are completed.</p>
                </div>
            `;
        }

        document.getElementById('reportDataContainer').innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 35px; margin-top: 10px;">

                <div style="width: 100%;">
                    <h4 style="color: #0f172a; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i>Passenger Traffic Analysis (${daysText})
                    </h4>
                    <hr style="border: none; border-top: 2px solid #f1f5f9; margin-bottom: 25px;">
                    
                    <p style="text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 10px; font-weight: 600;">Hourly Completed Passenger Trips</p>
                    <div style="width: 100%; height: 220px; margin-bottom: 25px;">
                        <canvas id="peakHoursChart"></canvas>
                    </div>

                    ${insightsHTML}
                </div>

                <div style="width: 100%; height: auto; margin-bottom: 20px; display: flex; flex-direction: column; page-break-inside: avoid; break-inside: avoid;">
                    <h4 style="color: #0f172a; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-bus-simple" style="color: #16a34a;"></i>Operational Performance Summary (${daysText})
                    </h4>
                    <hr style="border: none; border-top: 2px solid #f1f5f9; margin-bottom: 25px;">

                    <p style="text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 10px; font-weight: 600;">Trip Success Distribution</p>
                    
                    <div style="width: 100%; max-width: 320px; margin: 0 auto 20px auto;">
                        <canvas id="pdfReportChart" style="height: 320px !important;"></canvas>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #475569;">Total Trips Commenced</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a; text-align: right;">${periodAnalytics.totalTrips}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #475569;">Trips Completed</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a; text-align: right;">${periodAnalytics.completedTrips}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #475569;">Trips Cancelled</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a;; text-align: right;">${periodAnalytics.cancelledTrips}</td>
                            </tr>
                            <tr>
                                <td style="padding: 25px 12px 10px 12px; font-weight: bold; color: #0f172a;">New Passengers Registered within ${daysText}</td>
                                <td style="padding: 25px 12px 10px 12px; font-weight: bold; color: #0f172a; text-align: right;">${periodAnalytics.newPassengers}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="width: 100%;">
                    <h4 style="color: #0f172a; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-satellite-dish" style="color: #64748b;"></i>Current System Details
                    </h4>
                    <hr style="border: none; border-top: 2px solid #f1f5f9; margin-bottom: 15px;">
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tbody>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #475569;">Total Active Buses at the moment</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a; text-align: right;">${systemSnapshot.activeBuses}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 12px; color: #475569;">Total Offline Buses at the moment</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a; text-align: right;">${systemSnapshot.offlineBuses}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; color: #475569;">Active Routes at the moment</td>
                                <td style="padding: 12px; font-weight: bold; color: #0f172a; text-align: right;">${systemSnapshot.activeRoutes}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Rush Hour Passenger Traffic summery (Line Chart)
        const ctxPeak = document.getElementById('peakHoursChart').getContext('2d');
        if (peakHoursChartInstance) peakHoursChartInstance.destroy(); 

        peakHoursChartInstance = new Chart(ctxPeak, {
            type: 'line', 
            data: {
                labels: hourlyLabels,
                datasets: [{
                    label: 'Passengers',
                    data: passengerData, 
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                    fill: true, 
                    tension: 0.4, 
                    pointBackgroundColor: '#1e40af',
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false }, 
                    datalabels: { display: false } 
                },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 10 } } },
                    x: { ticks: { font: { size: 9 } } }
                }
            }
        });
        
        // Trip Status summery (Doughnut Chart)
        const ctx = document.getElementById('pdfReportChart');
        const totalReportTrips = (periodAnalytics.completedTrips || 0) + (periodAnalytics.cancelledTrips || 0);

        if (totalReportTrips === 0) {
            ctx.style.display = 'none';
            ctx.parentElement.innerHTML += `
                <div style="height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px;">
                    <i class="fa-solid fa-chart-pie" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p style="font-size: 0.9rem;">No data recorded for this timeframe</p>
                </div>`;
        } else {
            ctx.style.display = 'block';
            if (reportChartInstance) reportChartInstance.destroy();

            reportChartInstance = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Cancelled'],
                    datasets: [{
                        data: [periodAnalytics.completedTrips, periodAnalytics.cancelledTrips],
                        backgroundColor: ['#26a264', '#c43737'], 
                        borderWidth: 2, 
                        borderColor: '#ffffff'
                    }]
                },
                plugins: [ChartDataLabels], 
                options: {
                    responsive: true,
                    maintainAspectRatio: false, 
                    animation: false,
                    cutout: '60%', 
                    layout: { padding: { top: 25, bottom: 40, left: 20, right: 20 } },
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            padding: { top: 30 }, 
                            labels: { padding: 20, usePointStyle: true, boxWidth: 10 }
                        },
                        datalabels: {
                            color: '#0f172a', 
                            font: { weight: 'bold', size: 14 },
                            anchor: 'end', align: 'end', offset: -2, 
                            formatter: (value, ctx) => {
                                let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return (sum === 0 || value === 0) ? '' : Math.round((value * 100) / sum) + "%";
                            }
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('reportDataContainer').innerHTML = `<p style="text-align: center; color: #dc2626;">Error loading report. Ensure the backend server is reachable.</p>`;
    }
});

// PDF Generation Logic
downloadPdfBtn.addEventListener('click', async () => {
    const element = document.getElementById('reportPrintArea'); 
    const daysText = document.getElementById('date-range').options[document.getElementById('date-range').selectedIndex].text.replace(/\s+/g, '_');
    
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5], 
        filename: `Obsidian_Full_Report_${daysText}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            letterRendering: true 
        }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const originalText = downloadPdfBtn.innerHTML;
    downloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

    const originalZoom = document.body.style.zoom || "0.85"; 

    try {
        document.body.style.zoom = "1";

        element.style.height = 'auto';
        element.style.overflow = 'visible';

        await new Promise(resolve => setTimeout(resolve, 800));
        await html2pdf().set(opt).from(element).save();

        document.body.style.zoom = originalZoom;
        element.style.height = '';
        element.style.overflow = 'auto';
        downloadPdfBtn.innerHTML = originalText;
    } catch (error) {
        console.error('PDF Error:', error);

        document.body.style.zoom = originalZoom; 
        downloadPdfBtn.innerHTML = originalText; 
        element.style.height = '';
        element.style.overflow = 'auto';
    }
});

// Modal Close Logic
const closeModal = () => { 
    reportModal.style.display = 'none'; 
};

closeIconBtn.addEventListener('click', closeModal);

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
}

window.addEventListener('click', (event) => {
    if (event.target === reportModal) {
        closeModal();
    }
});