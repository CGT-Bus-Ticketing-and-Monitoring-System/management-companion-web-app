document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    
    if (navbarPlaceholder) {
        const currentPage = document.body.getAttribute('data-active-page');

        navbarPlaceholder.outerHTML = `
            <header class="navbar">
                <div class="logo">Bus<br>Buddy</div>
                
                <nav class="nav-links">
                    <a href="home.html" data-page="home">Home</a>
                    <a href="bus-status.html" data-page="status">Bus Status</a>
                    <a href="routes.html" data-page="routes">Routes</a>
                    <a href="passengers.html" data-page="passengers">Passengers</a>
                    <a href="operators.html" data-page="operators">Operators</a>
                    <a href="admin-mngmt.html" data-page="admin">Admin</a>
                    <a href="RFID-cards.html" data-page="cards">Cards</a>
                    <a href="schedule.html" data-page="schedule">Schedule</a>
                </nav>

                <div class="user-controls">
                    <button id="logout-btn">Log Out</button>
                </div>
            </header>
        `;

        const links = document.querySelectorAll('.navbar .nav-links a');
        links.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (confirm("Are you sure you want to log out?")) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminFName');
                    window.location.href = 'index.html';
                }
            });
        }
    }
});