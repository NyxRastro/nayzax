import os
import re

base_nav = """    <!-- ===== NAV ===== -->
    <nav class="navbar" id="shared-navbar">
        <div class="navbar-right">
            <a href="index.html" class="nav-logo">
                <img src="images/logo.png" alt="Logo" class="nav-logo-img">
            </a>
            <ul class="nav-links">
                <li><a href="index.html"{a_index}>الصفحة الرئيسية</a></li>
                <li><a href="story.html"{a_story}>القصص المسموعة</a></li>
                <li><a href="film.html"{a_film}>الفيلم</a></li>
                <li><a href="magazine.html"{a_magazine}>المجلة</a></li>
            </ul>
        </div>
        <div class="navbar-left">
            <div class="nav-search">
                <span class="nav-search-icon">🔍</span>
                <input type="text" placeholder="ابحث..." />
            </div>
            <button class="btn-login" onclick="window.location.href='subscribe.html'">تسجيل دخول</button>
            <button class="nav-hamburger" id="hamburger-btn">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>"""

for f in os.listdir('.'):
    if not f.endswith('.html'): continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<nav' not in content:
        continue
        
    # Determine active state
    a_index = ' class="active"' if f == 'index.html' else ''
    a_story = ' class="active"' if 'story' in f else ''
    a_film = ' class="active"' if f == 'film.html' else ''
    a_magazine = ' class="active"' if f == 'magazine.html' else ''
    
    # Format the nav
    nav_html = base_nav.format(a_index=a_index, a_story=a_story, a_film=a_film, a_magazine=a_magazine)
    
    # Replace anything from <nav... to </nav>
    # Note: re.DOTALL ensures . matches newlines
    new_content = re.sub(r'<!-- ===== NAV ===== -->(.*?)</nav>', nav_html, content, flags=re.DOTALL)
    if '<!-- ===== NAV ===== -->' not in content:
        # Fallback if comment is missing
        new_content = re.sub(r'<nav[^>]*>.*?</nav>', nav_html, content, flags=re.DOTALL)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f"Updated {f}")
