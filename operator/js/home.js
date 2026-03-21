let myPassengerChart; 
let fullFleetActivity = [];
let rawChartData = [];

document.addEventListener('DOMContentLoaded', () => {
    const operatorId = localStorage.getItem('operatorId') || localStorage.getItem('operator_id');
    const token = localStorage.getItem('operatorToken');
    const savedName = localStorage.getItem('operatorFName');

    if (!operatorId || !token) {
        window.location.replace('index.html'); 
        return;
    }

    const welcomeEl = document.getElementById('welcome-name') || document.querySelector('h1');
    if (welcomeEl) {
        welcomeEl.innerText = `Welcome, ${savedName || 'Operator'}`;
    }

    const timeRangeSelector = document.getElementById('timeRangeSelector');
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', (e) => {
            loadDashboardData(e.target.value);
        });
    }

    async function loadDashboardData(period = '30days') {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/operator/dashboard-summary/${operatorId}?period=${period}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                document.getElementById('total-buses').innerText = data.total_buses;
                document.getElementById('active-buses').innerText = data.active_buses;
                document.getElementById('inactive-buses').innerText = data.inactive_buses;

                        const titleEl = document.getElementById('earnings-card-title');
        if (titleEl) {
            if (period === 'today') {
                titleEl.innerHTML = "Today's<br>Earnings";
            } else if (period === '7days') {
                titleEl.innerHTML = "Last 7 Day's<br>Earnings";
            } else if (period === '30days') {
                titleEl.innerHTML = "Last 30 Day's<br>Earnings";
            }
}
                
                const formattedTotal = new Intl.NumberFormat().format(data.today_earnings);
                document.getElementById('earnings-display').innerText = `LKR ${formattedTotal}`;

                rawChartData = data.chart_data;
                fullFleetActivity = data.recent_activity;

                drawChart(rawChartData);
                populateDashboardTable(fullFleetActivity);
            }
        } catch (error) {
            console.error(error);
        }
    }

    loadDashboardData();

    function drawChart(chartData) {
        const ctx = document.getElementById('passengerTrendChart');
        if (!ctx) return;

        const labels = chartData.map(row => {
            const d = new Date(row.date);
            return `${d.getMonth()+1}/${d.getDate()}`; 
        });
        const dataPoints = chartData.map(row => row.passengers);

        if (myPassengerChart) myPassengerChart.destroy();

        myPassengerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length > 0 ? labels : ['No Data'],
                datasets: [{
                    label: 'Passengers',
                    data: dataPoints.length > 0 ? dataPoints : [0],
                    borderColor: '#004C82',
                    backgroundColor: 'rgba(0, 76, 130, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#004C82',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#004C82',
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) { return `${context.parsed.y} Passengers`; }
                        }
                    }
                },
                scales: { 
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                },
                animation: {
                    y: { duration: 1500, easing: 'easeOutQuart' }
                }
            }
        });
    }

    function populateDashboardTable(activityData) {
    const tbody = document.getElementById('recentActivityBody');
    const viewAllBtn = document.getElementById('viewAllFleetBtn');
    
    if (!tbody) return;
    
    tbody.innerHTML = ''; 

    if (!activityData || activityData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No fleet activity found.</td></tr>`;
        if (viewAllBtn) viewAllBtn.style.display = 'none';
        return;
    }

    const top5Data = activityData.slice(0, 5);

    top5Data.forEach(row => {
        const formattedEarned = new Intl.NumberFormat().format(row.earned || 0);
        const statusColor = row.status === 'ACTIVE' ? '#2ecc71' : '#f1c40f';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${row.registration_number || 'N/A'}</strong></td>
                <td>${row.route_code || 'Unassigned'}</td>
                <td><span class="badge" style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${row.status}</span></td>
                <td style="font-weight: bold; color: #004C82;">LKR ${formattedEarned}</td>
            </tr>
        `;
    });

    if (activityData.length > 5 && viewAllBtn) {
        viewAllBtn.style.display = 'flex';
        
        viewAllBtn.onclick = () => {
            const fleetBody = document.getElementById('fullFleetBody');
            fleetBody.innerHTML = '';
            
            fullFleetActivity.forEach(row => {
                const formattedEarned = new Intl.NumberFormat().format(row.earned || 0);
                const statusColor = row.status === 'ACTIVE' ? '#2ecc71' : '#f1c40f';
                
                fleetBody.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px;"><strong>${row.registration_number || 'N/A'}</strong></td>
                        <td style="padding: 12px;">${row.route_code || 'Unassigned'}</td>
                        <td style="padding: 12px;"><span class="badge" style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px;">${row.status}</span></td>
                        <td style="padding: 12px; font-weight: bold; color: #004C82;">LKR ${formattedEarned}</td>
                    </tr>
                `;
            });
            document.getElementById('fleetModal').style.display = 'flex';
        };
    } else if (viewAllBtn) {
        viewAllBtn.style.display = 'none';
    }
}

    document.getElementById('closeFleetModal').addEventListener('click', () => {
        document.getElementById('fleetModal').style.display = 'none';
    });

    const downloadBtn = document.querySelector('.banner-controls .btn-primary');
    const pdfModal = document.getElementById('pdfPreviewModal');
    let hiddenEarningsChart = null;
    downloadBtn.addEventListener('click', async () => {
        const originalBtnHTML = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<span>Loading...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
        downloadBtn.disabled = true;

        try {
            const daysSelect = document.getElementById('report-date-range').value;
            const periodText = document.getElementById('report-date-range').options[document.getElementById('report-date-range').selectedIndex].text;
            
            const earningsRes = await fetch(`${CONFIG.API_BASE_URL}/operator/earnings?period=last${daysSelect}days`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const earningsDataRaw = await earningsRes.json();
            const earningsData = Array.isArray(earningsDataRaw) ? earningsDataRaw : (earningsDataRaw.data || []);

            const earnLabels = [];
            const earnValues = [];
            let totalFaresForPeriod = 0;
            let totalPax = 0;
            const busPerformance = {};
            
            earningsData.forEach(item => {
                const busReg = item.bus || 'Unknown';
                const fares = Number(item.total_fares) || 0;
                const pax = Number(item.trips_count) || 0;

                earnLabels.push(`${new Date(item.date).getMonth()+1}/${new Date(item.date).getDate()} - ${busReg}`);
                earnValues.push(fares);
                
                totalFaresForPeriod += fares;
                totalPax += pax;

                if (!busPerformance[busReg]) {
                    busPerformance[busReg] = { pax: 0, fares: 0 };
                }
                busPerformance[busReg].pax += pax;
                busPerformance[busReg].fares += fares;
            });

            let topEarningBus = { bus: 'N/A', amount: 0 };
            Object.keys(busPerformance).forEach(busReg => {
                if (busPerformance[busReg].fares > topEarningBus.amount) {
                    topEarningBus = { bus: busReg, amount: busPerformance[busReg].fares };
                }
            });

            const hiddenCanvas = document.getElementById('hiddenEarningsCanvas');
            hiddenCanvas.width = 800;
            hiddenCanvas.height = 400;
            
            const hiddenCtx = hiddenCanvas.getContext('2d');
            hiddenCanvas.style.display = 'block';

            if (hiddenEarningsChart) hiddenEarningsChart.destroy();
            hiddenEarningsChart = new Chart(hiddenCtx, {
                type: 'bar',
                data: {
                    labels: earnLabels.length > 0 ? earnLabels : ['No Data'],
                    datasets: [{
                        label: 'Earnings (LKR)',
                        data: earnValues.length > 0 ? earnValues : [0],
                        backgroundColor: '#2ecc71',
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: { 
                    animation: false, 
                    responsive: false, 
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 10 },
                                callback: function(value) {
                                    let label = this.getLabelForValue(value);
                                    return label.length > 15 ? label.substring(0, 15) + '...' : label;
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { borderDash: [5, 5] }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                } 
            });

            document.getElementById('pdfEarningsChartImg').src = hiddenEarningsChart.toBase64Image();
            hiddenCanvas.style.display = 'none';
            if (myPassengerChart) {
                document.getElementById('pdfPassengerChartImg').src = myPassengerChart.toBase64Image();
            }

            let peakPax = 0;
            let peakDate = 'N/A';
            rawChartData.forEach(row => {
                if (row.passengers > peakPax) { 
                    peakPax = row.passengers; 
                    peakDate = new Date(row.date).toLocaleDateString(); 
                }
            });

            document.getElementById('previewPeriod').innerText = periodText;
            document.getElementById('prevEarnings').innerText = `LKR ${totalFaresForPeriod.toLocaleString()}`;
            document.getElementById('prevTotalPax').innerText = totalPax.toLocaleString();

            const insightsList = document.getElementById('pdfInsightsList');
            insightsList.innerHTML = `
                <li><strong>Traffic Overview:</strong> Passenger volume for the selected period reached a total of <strong>${totalPax.toLocaleString()}</strong> riders.</li>
                <li><strong>Demand Peak:</strong> The highest recorded traffic occurred on <strong>${peakDate}</strong> with <strong>${peakPax}</strong> passengers handled safely.</li>
                <li><strong>Financial Performance:</strong> The fleet generated a total of <strong>LKR ${totalFaresForPeriod.toLocaleString()}</strong> across all tracked routes during this timeframe.</li>
                <li><strong>Top Performer:</strong> Bus <strong>${topEarningBus.bus}</strong> led revenue generation with an overall total of <strong>LKR ${Number(topEarningBus.amount).toLocaleString()}</strong>.</li>
            `;

            let performanceTableHTML = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #004C82;">
                            <th style="padding: 10px; text-align: left; color: #004C82;">Bus Reg No</th>
                            <th style="padding: 10px; text-align: right; color: #004C82;">Total Passengers</th>
                            <th style="padding: 10px; text-align: right; color: #004C82;">Total Earnings (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            Object.keys(busPerformance).forEach(busReg => {
                performanceTableHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;"><strong>${busReg}</strong></td>
                        <td style="padding: 10px; text-align: right;">${busPerformance[busReg].pax.toLocaleString()}</td>
                        <td style="padding: 10px; text-align: right;">LKR ${busPerformance[busReg].fares.toLocaleString()}</td>
                    </tr>
                `;
            });

            performanceTableHTML += `</tbody></table>`;
            
            const breakdownContainer = document.getElementById('pdfBusBreakdown');
            if(breakdownContainer) {
                breakdownContainer.innerHTML = performanceTableHTML;
            }

            const opName = localStorage.getItem('operatorFName') || 'Operator';
document.getElementById('pdfOperatorName').innerText = opName;

const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
});
document.getElementById('pdfDate').innerText = currentDate;

            pdfModal.style.display = 'flex';

        } catch (error) {
            alert("Failed to load full report data. Please try again.");
        } finally {
            downloadBtn.innerHTML = originalBtnHTML;
            downloadBtn.disabled = false;
        }
    });

    const closePdf = () => pdfModal.style.display = 'none';
    document.getElementById('closePdfModal').addEventListener('click', closePdf);
    document.getElementById('cancelPdfBtn').addEventListener('click', closePdf);

document.getElementById('confirmDownloadBtn').addEventListener('click', () => {
        const printArea = document.getElementById('pdfPrintArea');
   
        const originalWidth = printArea.style.width;
        printArea.style.width = '800px';

        const opt = {
            margin: [15, 15, 15, 15], 
            filename: `Obsidian_Report_${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
       
            pagebreak: { mode: ['css', 'legacy', 'avoid-all'] } 
        };

        const btn = document.getElementById('confirmDownloadBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        btn.disabled = true;

        html2pdf().set(opt).from(printArea).save().then(() => {
            printArea.style.width = originalWidth; 
            closePdf(); 
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    });
});