class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <nav class="navbar" id="shared-navbar">
        <div class="navbar-right">
            <a href="index.html" class="nav-logo">
                <div class="nav-logo-icon"></div>
                <div class="nav-logo-text">نيزك</div>
            </a>
            <ul class="nav-links">
                <li><a href="index.html">الصفحة الرئيسية</a></li>
                <li><a href="story.html">القصص المسموعة</a></li>
                <li><a href="film.html">الفيلم</a></li>
                <li><a href="magazine.html">المجلة</a></li>
            </ul>
        </div>
        <div class="navbar-left">
            <div class="nav-search">
                <input type="text" placeholder="ابحث..." />
            </div>
            <a href="subscribe.html" class="btn-login">تسجيل دخول</a>
            <button class="nav-hamburger" id="hamburger-btn">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>
        `;

        // Active nav link detection
        const page = window.location.pathname.split('/').pop() || 'index.html';
        this.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');

            // Highlight logic based on page URL
            let isActive = false;
            if (href === page || (page === '' && href === 'index.html')) {
                isActive = true;
            } else if (href === 'story.html' && page.startsWith('story')) {
                isActive = true;
            } else if (href === 'film.html' && (page.startsWith('film') || page.startsWith('character'))) {
                isActive = true;
            } else if (href === 'magazine.html' && page.startsWith('magazine')) {
                isActive = true;
            }

            if (isActive) {
                link.classList.add('active');
            }
        });

        // Hamburger menu toggle (mobile)
        const hamburger = this.querySelector('#hamburger-btn');
        const navLinks = this.querySelector('.nav-links');
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            });
        }
    }
}

customElements.define('app-header', AppHeader);

// ===== PAGE TRANSITION LOGIC =====
window.navigateTo = function(url) {
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = url;
    }, 250); // Matches the 0.25s CSS animation
};

document.addEventListener('click', (e) => {
    // Find closest anchor tag
    const link = e.target.closest('a');
    
    // If it's a valid internal link
    if (link && link.href && link.target !== '_blank' && !link.href.startsWith('javascript:') && !link.href.includes('#')) {
        const currentDomain = window.location.hostname || '';
        const linkDomain = new URL(link.href).hostname || '';
        
        // Match internal or relative links
        if (currentDomain === linkDomain || !link.href.startsWith('http')) {
            e.preventDefault();
            window.navigateTo(link.href);
        }
    }
});

// Remove fade-out class if navigating back via BFCache
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        document.body.classList.remove('fade-out');
    }
});
