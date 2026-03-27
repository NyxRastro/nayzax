// Admin Panel Backend Integrations
document.addEventListener('DOMContentLoaded', () => {
    loadStories();
    loadMovies();
    loadMagazines();
});

async function loadStories() {
    try {
        const res = await fetch('/api/stories');
        const stories = await res.json();
        const tbody = document.querySelector('#view-stories tbody');
        
        if (stories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد قصص بعد</td></tr>';
            return;
        }

        tbody.innerHTML = stories.map(s => `
            <tr>
                <td>
                    <div class="td-media">
                        ${s.cover_image ? `<img src="${s.cover_image}" alt="cover" />` : `<div style="width: 48px; height: 48px; border-radius: 10px; background: #C084FC; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;"><i class="fa-solid fa-music"></i></div>`}
                        <div>
                            <strong>${s.title}</strong>
                        </div>
                    </div>
                </td>
                <td>${s.duration || 'غير محدد'}</td>
                <td>${new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                <td><span class="status-badge ${s.status === 1 ? 'status-active' : 'status-draft'}">${s.status === 1 ? 'منشور' : 'مسودة'}</span></td>
                <td>
                    <div class="td-actions">
                        <button class="btn-icon edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(err) {
        console.error('Error loading stories:', err);
    }
}

async function saveStory() {
    const form = document.getElementById('form-story');
    const btn = document.getElementById('btn-save-story');
    const formData = new FormData(form);
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/stories', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('تم حفظ القصة بنجاح!');
            closeModal('modal-story');
            form.reset();
            loadStories(); // Refresh
        } else {
            alert('حدث خطأ أثناء الحفظ');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadMovies() {
    try {
        const res = await fetch('/api/movies');
        const movies = await res.json();
        const tbody = document.querySelector('#view-movies tbody');
        
        if (movies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد أفلام بعد</td></tr>';
            return;
        }

        tbody.innerHTML = movies.map(s => `
            <tr>
                <td>
                    <div class="td-media">
                        ${s.thumbnail ? `<img src="${s.thumbnail}" alt="thumb" />` : `<div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(236, 72, 153, 0.2); color: #EC4899; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;"><i class="fa-solid fa-film"></i></div>`}
                        <div>
                            <strong>${s.title}</strong>
                        </div>
                    </div>
                </td>
                <td>${s.duration || 'غير محدد'}</td>
                <td>${(s.description || 'بدون وصف').substring(0,30)}...</td>
                <td><span class="status-badge ${s.status === 1 ? 'status-active' : 'status-draft'}">${s.status === 1 ? 'منشور' : 'مسودة'}</span></td>
                <td>
                    <div class="td-actions">
                        <button class="btn-icon edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(err) {
        console.error('Error loading movies:', err);
    }
}

async function saveMovie() {
    const form = document.getElementById('form-movie');
    const btn = document.getElementById('btn-save-movie');
    const formData = new FormData(form);
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/movies', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('تم حفظ الفيلم بنجاح!');
            closeModal('modal-movie');
            form.reset();
            loadMovies();
        } else {
            alert('حدث خطأ أثناء الحفظ');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadMagazines() {
    try {
        const res = await fetch('/api/magazines');
        const mags = await res.json();
        const tbody = document.querySelector('#view-magazines tbody');
        
        if (mags.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا توجد مجلات بعد</td></tr>';
            return;
        }

        tbody.innerHTML = mags.map(m => `
            <tr>
                <td>
                    <div class="td-media">
                        ${m.cover_image ? `<img src="${m.cover_image}" alt="cover" />` : `<div style="width: 48px; height: 48px; border-radius: 10px; background: rgba(52, 211, 153, 0.2); color: #34D399; display:flex; align-items:center; justify-content:center; font-size: 1.5rem;"><i class="fa-solid fa-book-open"></i></div>`}
                        <div>
                            <strong>${m.title}</strong>
                            <div style="font-size: 0.85rem; color: #94a3b8;">العدد ${m.issue_number}</div>
                        </div>
                    </div>
                </td>
                <td>${m.publish_date || 'غير محدد'}</td>
                <td>
                    <div class="td-actions">
                        <button class="btn-icon edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(err) {
        console.error('Error loading magazines:', err);
    }
}

async function saveMagazine() {
    const form = document.getElementById('form-magazine');
    const btn = document.getElementById('btn-save-magazine');
    const formData = new FormData(form);
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/magazines', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('تم حفظ العدد بنجاح!');
            closeModal('modal-magazine');
            form.reset();
            loadMagazines();
        } else {
            alert('حدث خطأ أثناء الحفظ');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
