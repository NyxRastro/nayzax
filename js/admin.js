/* =========================================================
   NAYZAK — Admin Panel JS  (Full CRUD: Add / Edit / Delete)
   ========================================================= */

// ── Toast notification ──────────────────────────────────────
function showToast(msg, type = 'success') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.style.cssText = `
            position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
            background: rgba(13,8,32,0.95); border:1px solid;
            border-radius:12px; padding:14px 28px; font-family:'Cairo',sans-serif;
            font-size:0.97rem; font-weight:600; z-index:99999;
            transition:opacity .35s; box-shadow:0 8px 30px rgba(0,0,0,.5);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.borderColor = type === 'success' ? '#34D399' : '#EF4444';
    toast.style.color       = type === 'success' ? '#34D399' : '#EF4444';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Expose globally (used by inline onclick in admin.html)
window.openModal  = openModal;
window.closeModal = closeModal;

// ── Stats ─────────────────────────────────────────────────────
async function refreshStats() {
    try {
        const res  = await fetch('/api/stats');
        const data = await res.json();
        const el = (id) => document.getElementById(id);
        if (el('stat-stories')) el('stat-stories').textContent = data.stories;
        if (el('stat-movies'))  el('stat-movies').textContent  = data.movies;
        if (el('stat-mags'))    el('stat-mags').textContent    = data.magazines;
        if (el('stat-opinions')) el('stat-opinions').textContent = data.opinions;
    } catch(_) {}
}

// ═══════════════════════════════════════════════════════════════
//  STORIES
// ═══════════════════════════════════════════════════════════════

function storyRow(s) {
    const cover = s.cover_image
        ? `<img src="${s.cover_image}" alt="cover" />`
        : `<div style="width:48px;height:48px;border-radius:10px;background:#C084FC;display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fa-solid fa-music"></i></div>`;
    const badge = s.status === 1
        ? `<span class="status-badge status-active">منشور</span>`
        : `<span class="status-badge status-draft">مسودة</span>`;

    return `
    <tr data-id="${s.id}">
        <td>
            <div class="td-media">
                ${cover}
                <div><strong>${s.title}</strong></div>
            </div>
        </td>
        <td>${s.duration || 'غير محدد'}</td>
        <td>${s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : '—'}</td>
        <td>${badge}</td>
        <td>
            <div class="td-actions">
                <button class="btn-icon edit"   onclick="editStory(${s.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteStory(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

async function loadStories() {
    const tbody = document.querySelector('#view-stories tbody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;
    try {
        const res     = await fetch('/api/stories');
        const stories = await res.json();
        tbody.innerHTML = stories.length
            ? stories.map(storyRow).join('')
            : `<tr><td colspan="5" style="text-align:center;opacity:.5;">لا توجد قصص بعد</td></tr>`;
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#EF4444;">خطأ في تحميل البيانات</td></tr>`;
    }
}

// Cache for edit
let _editingStoryId = null;

async function editStory(id) {
    try {
        const res     = await fetch('/api/stories');
        const stories = await res.json();
        const s       = stories.find(x => x.id === id);
        if (!s) return;
        _editingStoryId = id;

        document.querySelector('#modal-story .modal-header h2').textContent = 'تعديل القصة';
        const form = document.getElementById('form-story');
        form.title.value       = s.title || '';
        form.duration.value    = s.duration || '';
        form.status.value      = s.status ?? 1;
        form.description.value = s.description || '';
        openModal('modal-story');
    } catch(e) { showToast('تعذّر تحميل بيانات القصة', 'error'); }
}

async function saveStory() {
    const form = document.getElementById('form-story');
    const btn  = document.getElementById('btn-save-story');
    const fd   = new FormData(form);

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled  = true;

    try {
        let res;
        if (_editingStoryId) {
            res = await fetch(`/api/stories/${_editingStoryId}`, { method: 'PUT', body: fd });
        } else {
            res = await fetch('/api/stories', { method: 'POST', body: fd });
        }

        if (!res.ok) throw new Error();
        const saved = await res.json();

        // Live update table
        const tbody  = document.querySelector('#view-stories tbody');
        const oldRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
        if (oldRow) {
            oldRow.outerHTML = storyRow(saved);
        } else {
            // Prepend new row with highlight
            tbody.insertAdjacentHTML('afterbegin', storyRow(saved));
            const newRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
            newRow.style.background = 'rgba(192,132,252,.18)';
            setTimeout(() => newRow.style.background = '', 1800);
        }

        // Remove empty-state row if present
        const emptyRow = tbody.querySelector('td[colspan]');
        if (emptyRow) emptyRow.closest('tr').remove();

        closeModal('modal-story');
        form.reset();
        _editingStoryId = null;
        document.querySelector('#modal-story .modal-header h2').textContent = 'إضافة قصة مسموعة جديدة';
        showToast(_editingStoryId ? 'تم تحديث القصة ✓' : 'تمت إضافة القصة ✓');
        refreshStats();
    } catch(_) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
        btn.innerHTML = 'حفظ القصة';
        btn.disabled  = false;
    }
}

async function deleteStory(id) {
    if (!confirm('هل أنت متأكد من حذف هذه القصة؟')) return;
    const row = document.querySelector(`#view-stories tr[data-id="${id}"]`);
    if (row) { row.style.opacity = '.4'; row.style.pointerEvents = 'none'; }
    try {
        const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        if (row) row.remove();
        const tbody = document.querySelector('#view-stories tbody');
        if (!tbody.querySelector('tr')) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.5;">لا توجد قصص بعد</td></tr>`;
        }
        showToast('تم حذف القصة');
        refreshStats();
    } catch(_) {
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
        showToast('فشل الحذف', 'error');
    }
}

window.saveStory   = saveStory;
window.editStory   = editStory;
window.deleteStory = deleteStory;

// ═══════════════════════════════════════════════════════════════
//  MOVIES
// ═══════════════════════════════════════════════════════════════

function movieRow(m) {
    const thumb = m.thumbnail
        ? `<img src="${m.thumbnail}" alt="thumb" />`
        : `<div style="width:48px;height:48px;border-radius:10px;background:rgba(236,72,153,.2);color:#EC4899;display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fa-solid fa-film"></i></div>`;
    const badge = m.status === 1
        ? `<span class="status-badge status-active">منشور</span>`
        : `<span class="status-badge status-draft">مسودة</span>`;

    return `
    <tr data-id="${m.id}">
        <td>
            <div class="td-media">
                ${thumb}
                <div><strong>${m.title}</strong></div>
            </div>
        </td>
        <td>${m.duration || 'غير محدد'}</td>
        <td>${(m.description || 'بدون وصف').substring(0, 30)}...</td>
        <td>${badge}</td>
        <td>
            <div class="td-actions">
                <button class="btn-icon edit"   onclick="editMovie(${m.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon edit"   onclick="manageStoryboards(${m.id})" title="ستوري بورد" style="color:#C084FC"><i class="fa-solid fa-images"></i></button>
                <button class="btn-icon edit"   onclick="manageCharacters(${m.id})" title="شخصيات" style="color:#C084FC"><i class="fa-solid fa-users"></i></button>
                <button class="btn-icon delete" onclick="deleteMovie(${m.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

async function loadMovies() {
    const tbody = document.querySelector('#view-movies tbody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.6;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;
    try {
        const res    = await fetch('/api/movies');
        const movies = await res.json();
        tbody.innerHTML = movies.length
            ? movies.map(movieRow).join('')
            : `<tr><td colspan="5" style="text-align:center;opacity:.5;">لا توجد أفلام بعد</td></tr>`;
    } catch(_) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#EF4444;">خطأ في تحميل البيانات</td></tr>`;
    }
}

let _editingMovieId = null;

async function editMovie(id) {
    try {
        const res    = await fetch('/api/movies');
        const movies = await res.json();
        const m      = movies.find(x => x.id === id);
        if (!m) return;
        _editingMovieId = id;

        document.querySelector('#modal-movie .modal-header h2').textContent = 'تعديل الفيلم';
        const form = document.getElementById('form-movie');
        form.title.value       = m.title || '';
        form.duration.value    = m.duration || '';
        form.status.value      = m.status ?? 1;
        form.description.value = m.description || '';
        openModal('modal-movie');
    } catch(_) { showToast('تعذّر تحميل بيانات الفيلم', 'error'); }
}

async function saveMovie() {
    const form = document.getElementById('form-movie');
    const btn  = document.getElementById('btn-save-movie');
    const fd   = new FormData(form);

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled  = true;

    try {
        let res;
        if (_editingMovieId) {
            res = await fetch(`/api/movies/${_editingMovieId}`, { method: 'PUT', body: fd });
        } else {
            res = await fetch('/api/movies', { method: 'POST', body: fd });
        }

        if (!res.ok) throw new Error();
        const saved = await res.json();

        const tbody  = document.querySelector('#view-movies tbody');
        const oldRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
        if (oldRow) {
            oldRow.outerHTML = movieRow(saved);
        } else {
            tbody.insertAdjacentHTML('afterbegin', movieRow(saved));
            const newRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
            newRow.style.background = 'rgba(236,72,153,.15)';
            setTimeout(() => newRow.style.background = '', 1800);
        }

        const emptyRow = tbody.querySelector('td[colspan]');
        if (emptyRow) emptyRow.closest('tr').remove();

        closeModal('modal-movie');
        form.reset();
        _editingMovieId = null;
        document.querySelector('#modal-movie .modal-header h2').textContent = 'إضافة فيلم جديد';
        showToast('تمت إضافة/تحديث الفيلم ✓');
        refreshStats();
    } catch(_) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
        btn.innerHTML = 'حفظ الفيلم';
        btn.disabled  = false;
    }
}

async function deleteMovie(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيلم؟')) return;
    const row = document.querySelector(`#view-movies tr[data-id="${id}"]`);
    if (row) { row.style.opacity = '.4'; row.style.pointerEvents = 'none'; }
    try {
        const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        if (row) row.remove();
        const tbody = document.querySelector('#view-movies tbody');
        if (!tbody.querySelector('tr')) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.5;">لا توجد أفلام بعد</td></tr>`;
        }
        showToast('تم حذف الفيلم');
        refreshStats();
    } catch(_) {
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
        showToast('فشل الحذف', 'error');
    }
}

window.saveMovie   = saveMovie;
window.editMovie   = editMovie;
window.deleteMovie = deleteMovie;

// ===== MOVIE STORYBOARDS =====
let _currentMovieIdForSb = null;

async function manageStoryboards(movieId) {
    _currentMovieIdForSb = movieId;
    openModal('modal-movie-storyboards');
    loadStoryboards();
}

async function loadStoryboards() {
    const list = document.getElementById('storyboard-list');
    list.innerHTML = '<div style="opacity:0.6; padding:10px;">جاري التحميل...</div>';
    try {
        const res = await fetch(`/api/movies/${_currentMovieIdForSb}/storyboards`);
        const sbs = await res.json();
        if (sbs.length === 0) {
            list.innerHTML = '<div style="opacity:0.5; padding:10px;">لا يوجد صور ستوري بورد</div>';
            return;
        }
        list.innerHTML = sbs.map(sb => `
            <div style="position:relative; border-radius:8px; overflow:hidden; background:#222;">
                <img src="${sb.image}" style="width:100%; height:120px; object-fit:cover; display:block;">
                <button class="btn-icon delete" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); margin:0;" onclick="deleteStoryboard(${sb.id})" title="حذف الصورة">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `).join('');
    } catch {
        list.innerHTML = '<div style="color:#EF4444;">خطأ في تحميل الصور</div>';
    }
}

async function uploadStoryboard() {
    const fileInput = document.getElementById('new-storyboard-file');
    if (!fileInput.files.length) {
        showToast('الرجاء اختيار صورة', 'error');
        return;
    }
    const fd = new FormData();
    fd.append('image', fileInput.files[0]);
    try {
        const res = await fetch(`/api/movies/${_currentMovieIdForSb}/storyboards`, {method: 'POST', body: fd});
        if (!res.ok) throw new Error();
        fileInput.value = '';
        loadStoryboards();
        showToast('تمت إضافة الصورة');
    } catch {
        showToast('فشل الرفع', 'error');
    }
}

async function deleteStoryboard(sbId) {
    if (!confirm('حذف هذه الصورة؟')) return;
    try {
        const res = await fetch(`/api/storyboards/${sbId}`, {method: 'DELETE'});
        if (!res.ok) throw new Error();
        loadStoryboards();
    } catch {
        showToast('فشل الحذف', 'error');
    }
}

window.manageStoryboards = manageStoryboards;
window.uploadStoryboard  = uploadStoryboard;
window.deleteStoryboard  = deleteStoryboard;


// ===== MOVIE CHARACTERS =====
let _currentMovieIdForChar = null;

async function manageCharacters(movieId) {
    _currentMovieIdForChar = movieId;
    openModal('modal-movie-characters');
    document.getElementById('form-character').reset();
    loadCharacters();
}

async function loadCharacters() {
    const list = document.getElementById('character-list');
    list.innerHTML = '<div style="opacity:0.6;">جاري التحميل...</div>';
    try {
        const res = await fetch(`/api/movies/${_currentMovieIdForChar}/characters`);
        const chars = await res.json();
        if (chars.length === 0) {
            list.innerHTML = '<div style="opacity:0.5;">لا يوجد شخصيات مضافة</div>';
            return;
        }
        list.innerHTML = chars.map(c => `
            <div style="display:flex; background:rgba(255,255,255,0.05); border-radius:12px; padding:15px; gap:15px; align-items:center;">
                <img src="${c.image}" style="width:70px; height:70px; border-radius:10px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:700; color:#C084FC; font-size:1.1rem;">${c.name}</div>
                    <div style="font-size:0.85rem; color:#94a3b8; margin-top:3px;">الاسم مدمج في الصورة</div>
                </div>
                <button class="btn-icon delete" onclick="deleteCharacter(${c.id})" title="حذف الشخصية"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('');
    } catch {
        list.innerHTML = '<div style="color:#EF4444;">خطأ في التحميل</div>';
    }
}

async function addMovieCharacter() {
    const form = document.getElementById('form-character');
    const fd = new FormData(form);
    try {
        const res = await fetch(`/api/movies/${_currentMovieIdForChar}/characters`, {method: 'POST', body: fd});
        if (!res.ok) throw new Error();
        form.reset();
        loadCharacters();
        showToast('تمت إضافة الشخصية');
    } catch {
        showToast('فشل الإضافة', 'error');
    }
}

async function deleteCharacter(charId) {
    if (!confirm('حذف هذه الشخصية؟')) return;
    try {
        const res = await fetch(`/api/characters/${charId}`, {method: 'DELETE'});
        if (!res.ok) throw new Error();
        loadCharacters();
    } catch {
        showToast('فشل الحذف', 'error');
    }
}

window.manageCharacters  = manageCharacters;
window.addMovieCharacter = addMovieCharacter;
window.deleteCharacter   = deleteCharacter;

// ═══════════════════════════════════════════════════════════════
//  MAGAZINES
// ═══════════════════════════════════════════════════════════════

function magRow(m) {
    const cover = m.cover_image
        ? `<img src="${m.cover_image}" alt="cover" />`
        : `<div style="width:48px;height:48px;border-radius:10px;background:rgba(52,211,153,.2);color:#34D399;display:flex;align-items:center;justify-content:center;font-size:1.5rem;"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <tr data-id="${m.id}">
        <td>
            <div class="td-media">
                ${cover}
                <div>
                    <strong>${m.title}</strong>
                    <div style="font-size:.85rem;color:#94a3b8;">العدد ${m.issue_number || '—'}</div>
                </div>
            </div>
        </td>
        <td>${m.publish_date || 'غير محدد'}</td>
        <td>
            <div class="td-actions">
                <button class="btn-icon edit"   onclick="editMagazine(${m.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteMagazine(${m.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

async function loadMagazines() {
    const tbody = document.querySelector('#view-magazines tbody');
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;opacity:.6;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;
    try {
        const res  = await fetch('/api/magazines');
        const mags = await res.json();
        tbody.innerHTML = mags.length
            ? mags.map(magRow).join('')
            : `<tr><td colspan="3" style="text-align:center;opacity:.5;">لا توجد مجلات بعد</td></tr>`;
    } catch(_) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#EF4444;">خطأ في تحميل البيانات</td></tr>`;
    }
}

let _editingMagId = null;

async function editMagazine(id) {
    try {
        const res  = await fetch('/api/magazines');
        const mags = await res.json();
        const m    = mags.find(x => x.id === id);
        if (!m) return;
        _editingMagId = id;

        document.querySelector('#modal-magazine .modal-header h2').textContent = 'تعديل المجلة';
        const form = document.getElementById('form-magazine');
        form.title.value        = m.title || '';
        form.issue_number.value = m.issue_number || '';
        form.publish_date.value = m.publish_date || '';
        openModal('modal-magazine');
    } catch(_) { showToast('تعذّر تحميل بيانات المجلة', 'error'); }
}

async function saveMagazine() {
    const form = document.getElementById('form-magazine');
    const btn  = document.getElementById('btn-save-magazine');
    const fd   = new FormData(form);

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled  = true;

    try {
        let res;
        if (_editingMagId) {
            res = await fetch(`/api/magazines/${_editingMagId}`, { method: 'PUT', body: fd });
        } else {
            res = await fetch('/api/magazines', { method: 'POST', body: fd });
        }

        if (!res.ok) throw new Error();
        const saved = await res.json();

        const tbody  = document.querySelector('#view-magazines tbody');
        const oldRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
        if (oldRow) {
            oldRow.outerHTML = magRow(saved);
        } else {
            tbody.insertAdjacentHTML('afterbegin', magRow(saved));
            const newRow = tbody.querySelector(`tr[data-id="${saved.id}"]`);
            newRow.style.background = 'rgba(52,211,153,.12)';
            setTimeout(() => newRow.style.background = '', 1800);
        }

        const emptyRow = tbody.querySelector('td[colspan]');
        if (emptyRow) emptyRow.closest('tr').remove();

        closeModal('modal-magazine');
        form.reset();
        _editingMagId = null;
        document.querySelector('#modal-magazine .modal-header h2').textContent = 'إضافة مجلة جديدة';
        showToast('تمت إضافة/تحديث المجلة ✓');
        refreshStats();
    } catch(_) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
        btn.innerHTML = 'حفظ المجلة';
        btn.disabled  = false;
    }
}

async function deleteMagazine(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العدد؟')) return;
    const row = document.querySelector(`#view-magazines tr[data-id="${id}"]`);
    if (row) { row.style.opacity = '.4'; row.style.pointerEvents = 'none'; }
    try {
        const res = await fetch(`/api/magazines/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        if (row) row.remove();
        const tbody = document.querySelector('#view-magazines tbody');
        if (!tbody.querySelector('tr')) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;opacity:.5;">لا توجد مجلات بعد</td></tr>`;
        }
        showToast('تم حذف العدد');
        refreshStats();
    } catch(_) {
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
        showToast('فشل الحذف', 'error');
    }
}

window.saveMagazine   = saveMagazine;
window.editMagazine   = editMagazine;
window.deleteMagazine = deleteMagazine;

// ═══════════════════════════════════════════════════════════════
//  OPINIONS
// ═══════════════════════════════════════════════════════════════

let _allOpinions = [];

function opinionRow(o) {
    const isLong = o.message && o.message.length > 50;
    const shortMsg = isLong ? o.message.substring(0, 50) + '...' : o.message;
    return `
    <tr data-id="${o.id}">
        <td style="font-weight:700; color:#C084FC;">${o.name || 'زائر مجهول'}</td>
        <td style="max-width:300px; word-wrap:break-word; white-space:normal; line-height:1.5;">${shortMsg}</td>
        <td>${o.created_at ? new Date(o.created_at).toLocaleString('ar-EG') : '—'}</td>
        <td>
            <div class="td-actions">
                <button class="btn-icon edit" onclick="viewOpinion(${o.id})" title="عرض الرأي"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon delete" onclick="deleteOpinion(${o.id})" title="حذف الرأي"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`;
}

async function loadOpinions() {
    const tbody = document.querySelector('#view-opinions tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.6;"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;
    try {
        const res      = await fetch('/api/opinions');
        _allOpinions   = await res.json();
        tbody.innerHTML = _allOpinions.length
            ? _allOpinions.map(opinionRow).join('')
            : `<tr><td colspan="4" style="text-align:center;opacity:.5;">لا توجد آراء بعد</td></tr>`;
    } catch(_) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#EF4444;">خطأ في تحميل البيانات</td></tr>`;
    }
}

function viewOpinion(id) {
    const o = _allOpinions.find(x => String(x.id) === String(id));
    if (!o) {
        console.error('Opinion not found for ID:', id);
        return;
    }
    document.getElementById('opinion-modal-name').textContent = o.name || 'زائر مجهول';
    document.getElementById('opinion-modal-date').textContent = o.created_at ? new Date(o.created_at).toLocaleString('ar-EG') : '—';
    document.getElementById('opinion-modal-message').textContent = o.message;
    openModal('modal-opinion');
}

async function deleteOpinion(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
    const row = document.querySelector(`#view-opinions tr[data-id="${id}"]`);
    if (row) { row.style.opacity = '.4'; row.style.pointerEvents = 'none'; }
    try {
        const res = await fetch(`/api/opinions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        if (row) row.remove();
        const tbody = document.querySelector('#view-opinions tbody');
        if (!tbody.querySelector('tr')) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:.5;">لا توجد آراء بعد</td></tr>`;
        }
        showToast('تم حذف الرأي');
    } catch(_) {
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
        showToast('فشل الحذف', 'error');
    }
}

window.deleteOpinion = deleteOpinion;
window.viewOpinion   = viewOpinion;

// Reset edit state when opening modals for new items
document.addEventListener('DOMContentLoaded', () => {
    // "Add new" buttons reset edit state
    document.querySelector('[onclick="openModal(\'modal-story\')"]')?.addEventListener('click', () => {
        _editingStoryId = null;
        document.querySelector('#modal-story .modal-header h2').textContent = 'إضافة قصة مسموعة جديدة';
        document.getElementById('form-story')?.reset();
    });
    document.querySelector('[onclick="openModal(\'modal-movie\')"]')?.addEventListener('click', () => {
        _editingMovieId = null;
        document.querySelector('#modal-movie .modal-header h2').textContent = 'إضافة فيلم جديد';
        document.getElementById('form-movie')?.reset();
    });
    document.querySelector('[onclick="openModal(\'modal-magazine\')"]')?.addEventListener('click', () => {
        _editingMagId = null;
        document.querySelector('#modal-magazine .modal-header h2').textContent = 'إضافة عدد مجلة جديد';
        document.getElementById('form-magazine')?.reset();
    });

    loadStories();
    loadMovies();
    loadMagazines();
    loadOpinions();
    refreshStats();
});
