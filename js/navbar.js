document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    
    if (navbarPlaceholder) {
        navbarPlaceholder.outerHTML = `
            <header class="navbar">
                <div class="logo">Obsidian Bus<br>Tracking</div>
                
                <nav class="nav-links">
                    <a href="home.html" data-page="home">Home</a>
                    <a href="bus-status.html" data-page="status">Bus Status</a>
                    <a href="routes.html" data-page="routes">Routes</a>
                    <a href="passengers.html" data-page="passengers">Passengers</a>
                    <a href="operators.html" data-page="operators">Operators</a>
                    <a href="admin-mngmt.html" data-page="admin">Admin</a>
                    <a href="RFID-cards.html" data-page="cards">Cards</a>
                </nav>

                <button class="logout-btn" onclick="window.location.href='index.html'">Log Out</button>
            </header>
        `;

        const currentPage = document.body.getAttribute('data-active-page');
        
        const links = document.querySelectorAll('.navbar .nav-links a');
        
        links.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });
    }
});