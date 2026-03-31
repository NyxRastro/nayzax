class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <nav class="navbar" id="shared-navbar">
        <div class="navbar-right">
            <a href="index.html" class="nav-logo">
                <img src="images/logo.png" alt="Logo" class="nav-logo-img">
            </a>
            <ul class="nav-links">
                <li><a href="index.html">الصفحة الرئيسية</a></li>
                <li><a href="story.html">القصص المسموعة</a></li>
                <li><a href="film.html">الفيلم</a></li>
                <li><a href="magazine.html">المجلة</a></li>
            </ul>
        </div>
        <div class="navbar-left">
            <a href="feedback.html" class="nav-opinions-btn">اراؤكم</a>
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

        // ===== DEV RELOAD WATCHER =====
        // This only runs in development (Flask debug mode)
        const checkReload = async () => {
            try {
                const res = await fetch('/api/dev/reload-check');
                if (!res.ok) return;
                const data = await res.json();
                const currentId = sessionStorage.getItem('server_id');
                if (currentId && currentId !== data.server_id) {
                    sessionStorage.setItem('server_id', data.server_id);
                    window.location.reload();
                } else if (!currentId) {
                    sessionStorage.setItem('server_id', data.server_id);
                }
            } catch (e) {
                // Server might be restarting, just wait
            }
        };
        // Check every 1.5 seconds
        if (!window.reloadWatcherInit) {
            window.reloadWatcherInit = true;
            setInterval(checkReload, 1500);
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
// ===== GLOBAL NAYZAK (SHOOTING STAR) ANIMATION =====
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Only exclude admin panel
    const isExcluded = path.endsWith('admin-panel-x9f2k.html');
    
    // Check if stars are already hardcoded (like in about, vision, mission, contact)
    const alreadyHasStars = document.querySelector('.shooting-star');
    
    if (!isExcluded && !alreadyHasStars) {
        const starContainer = document.createElement('div');
        starContainer.style.position = 'fixed';
        starContainer.style.inset = '0';
        starContainer.style.pointerEvents = 'none';
        starContainer.style.zIndex = '0';
        starContainer.style.overflow = 'hidden';
        document.body.appendChild(starContainer);

        for (let i = 0; i < 6; i++) {
            const ss = document.createElement('div');
            ss.className = 'shooting-star-global';
            
            let startTop = Math.random() * 60 - 30; // -30vh to 30vh
            let startLeft = Math.random() * 60 + 40; // 40vw to 100vw
            let scale = 0.5 + Math.random() * 0.8; 

            ss.style.cssText = `
                top: ${startTop}vh;
                left: ${startLeft}vw;
                --scale: ${scale};
                --shot-dur: ${7 + Math.random() * 6}s;
                --delay: ${Math.random() * 12}s;
            `;
            starContainer.appendChild(ss);
        }
    }
});
