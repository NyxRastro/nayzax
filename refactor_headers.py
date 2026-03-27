import os
import re

for f in os.listdir('.'):
    if not f.endswith('.html'): continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<nav' not in content and '<app-header' in content:
        continue # Already refactored
        
    # Replace nav block with <app-header>
    # The nav block could be between <!-- ===== NAV ===== --> and </nav>
    # or just <nav ...> </nav>
    
    # Let's replace the whole nav element, including comments before it if any
    new_content = re.sub(r'(<!-- ===== NAVIGATION ===== -->\s*)?<!-- ===== NAV ===== -->\s*<nav[^>]*>.*?</nav>', '<app-header></app-header>', content, flags=re.DOTALL)
    
    # Also handle cases where the comments might be different
    if new_content == content:
        new_content = re.sub(r'<nav[^>]*>.*?</nav>', '<app-header></app-header>', content, flags=re.DOTALL)
        
    # Insert <script src="js/header.js"></script> right before <script src="js/main.js"></script>
    if 'js/header.js' not in new_content:
        new_content = new_content.replace('<script src="js/main.js"></script>', '<script src="js/header.js"></script>\n    <script src="js/main.js"></script>')
        
    # If the file doesn't have js/main.js, just append to body end
    if 'js/header.js' not in new_content:
        new_content = new_content.replace('</body>', '<script src="js/header.js"></script>\n</body>')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f"Refactored header in {f}")
