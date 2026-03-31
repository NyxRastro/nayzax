from flask import Flask, request, jsonify, send_from_directory, Response
import sqlite3
import os
import uuid
import html
import hashlib

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DB_FILE = os.path.join(BASE_DIR, 'nayzak.db')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
SERVER_ID = str(uuid.uuid4()) # Unique ID for each server restart

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            duration TEXT,
            status INTEGER,
            cover_image TEXT,
            audio_file TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            duration TEXT,
            status INTEGER,
            thumbnail TEXT,
            video_file TEXT,
            trailer_file TEXT,
            storyboard_file TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS magazines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            issue_number INTEGER,
            cover_image TEXT,
            pdf_file TEXT,
            publish_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id INTEGER,
            name TEXT NOT NULL,
            role TEXT,
            image TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS movie_storyboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id INTEGER,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS opinions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- SECURITY MIDDLEWARE ---

# The stored SHA-256 hashes for 'RAS' and 'El-Mejor712-Luna!'
ADMIN_USERNAME_HASH = '8a84fd359f8103230fb6d3f16f55a4c077bf1813b828216da3b1bd3272326774'
ADMIN_PASSWORD_HASH = '019ee9dab1867ea933f8ac445d07a7cf46fa6fd59f272664723b1f36fb8a3741'

# This will map the word you type in the browser URL
# If on Render, you set NAYZAK_ADMIN_PATH
ADMIN_URL_PATH = os.environ.get('NAYZAK_ADMIN_PATH', '/secret-admin-x9f2k')

@app.before_request
def require_admin():
    # If someone tries to access the backend files directly, show 404
    if request.path in ['/admin.html', '/admin_view.html', '/admin-panel-x9f2k.html']:
        return Response('Not Found', 404)
        
    # We protect the custom unguessable URL and all API modification endpoints
    needs_protection = False
    
    if request.path == ADMIN_URL_PATH:
        needs_protection = True
    elif request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'DELETE']:
        needs_protection = True
        
    if needs_protection:
        auth = request.authorization
        if not auth or not auth.username or not auth.password:
            return Response(
                'Could not verify your access level for that URL.\n'
                'You have to login with proper credentials', 401,
                {'WWW-Authenticate': 'Basic realm="Login Required"'})
                
        # Scramble incoming credentials into SHA-256 Hashes
        incoming_user_hash = hashlib.sha256(auth.username.encode('utf-8')).hexdigest()
        incoming_pass_hash = hashlib.sha256(auth.password.encode('utf-8')).hexdigest()
        
        # Compare mathematical identities securely
        if incoming_user_hash != ADMIN_USERNAME_HASH or incoming_pass_hash != ADMIN_PASSWORD_HASH:
            return Response(
                'Invalid credentials.', 401,
                {'WWW-Authenticate': 'Basic realm="Login Required"'})

# --- ROUTES ---

@app.route(ADMIN_URL_PATH)
def secret_admin_route():
    return app.send_static_file('admin_view.html')

@app.route('/')
def index():
    return app.send_static_file('index.html')

ALLOWED_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
    '.mp4', '.webm', '.ogg', '.mov',
    '.mp3', '.wav', '.m4a',
    '.pdf'
}

def allowed_file(filename):
    if not filename:
        return False
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

def sanitize_input(text):
    if text is None:
        return None
    return html.escape(str(text).strip())

def save_file(file_obj):
    if not file_obj or file_obj.filename == '':
        return None
    if not allowed_file(file_obj.filename):
        return None
    ext = os.path.splitext(file_obj.filename)[1]
    filename = str(uuid.uuid4()) + ext
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file_obj.save(filepath)
    return f'uploads/{filename}'

# ===== STATS =====

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    stories_count = conn.execute('SELECT COUNT(*) FROM stories').fetchone()[0]
    movies_count  = conn.execute('SELECT COUNT(*) FROM movies').fetchone()[0]
    mags_count    = conn.execute('SELECT COUNT(*) FROM magazines').fetchone()[0]
    opinions_count = conn.execute('SELECT COUNT(*) FROM opinions').fetchone()[0]
    conn.close()
    return jsonify({
        'stories': stories_count,
        'movies': movies_count,
        'magazines': mags_count,
        'opinions': opinions_count
    })

# ===== STORIES =====

@app.route('/api/stories', methods=['GET'])
def get_stories():
    conn = get_db_connection()
    stories = conn.execute('SELECT * FROM stories ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in stories])

@app.route('/api/stories', methods=['POST'])
def add_story():
    title       = sanitize_input(request.form.get('title'))
    duration    = sanitize_input(request.form.get('duration'))
    status      = request.form.get('status', type=int)
    description = sanitize_input(request.form.get('description'))
    cover_image = save_file(request.files.get('cover_image'))
    audio_file  = save_file(request.files.get('audio_file'))
    
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO stories (title, duration, status, cover_image, audio_file, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (title, duration, status, cover_image, audio_file, description))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM stories WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/stories/<int:story_id>', methods=['PUT'])
def update_story(story_id):
    title       = sanitize_input(request.form.get('title'))
    duration    = sanitize_input(request.form.get('duration'))
    status      = request.form.get('status', type=int)
    description = sanitize_input(request.form.get('description'))

    conn = get_db_connection()
    existing = conn.execute('SELECT * FROM stories WHERE id = ?', (story_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    new_cover = save_file(request.files.get('cover_image'))
    new_audio = save_file(request.files.get('audio_file'))
    cover_image = new_cover if new_cover else existing['cover_image']
    audio_file  = new_audio if new_audio else existing['audio_file']

    conn.execute('''
        UPDATE stories SET title=?, duration=?, status=?, cover_image=?, audio_file=?, description=?
        WHERE id=?
    ''', (title, duration, status, cover_image, audio_file, description, story_id))
    conn.commit()
    row = conn.execute('SELECT * FROM stories WHERE id = ?', (story_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/stories/<int:story_id>', methods=['DELETE'])
def delete_story(story_id):
    conn = get_db_connection()
    story = conn.execute('SELECT * FROM stories WHERE id = ?', (story_id,)).fetchone()
    if story:
        for path in [story['cover_image'], story['audio_file']]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
    conn.execute('DELETE FROM stories WHERE id = ?', (story_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ===== MOVIES =====

@app.route('/api/movies', methods=['GET'])
def get_movies():
    conn = get_db_connection()
    movies = conn.execute('SELECT * FROM movies ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in movies])

@app.route('/api/movies', methods=['POST'])
def add_movie():
    title          = sanitize_input(request.form.get('title'))
    duration       = sanitize_input(request.form.get('duration'))
    status         = request.form.get('status', type=int)
    description    = sanitize_input(request.form.get('description'))
    thumbnail      = save_file(request.files.get('thumbnail'))
    video_file     = save_file(request.files.get('video_file'))
    trailer_file   = save_file(request.files.get('trailer_file'))
    storyboard_file = save_file(request.files.get('storyboard_file'))
    
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO movies (title, duration, status, thumbnail, video_file, trailer_file, storyboard_file, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (title, duration, status, thumbnail, video_file, trailer_file, storyboard_file, description))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM movies WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/movies/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    title       = sanitize_input(request.form.get('title'))
    duration    = sanitize_input(request.form.get('duration'))
    status      = request.form.get('status', type=int)
    description = sanitize_input(request.form.get('description'))

    conn = get_db_connection()
    existing = conn.execute('SELECT * FROM movies WHERE id = ?', (movie_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    new_thumb   = save_file(request.files.get('thumbnail'))
    new_video   = save_file(request.files.get('video_file'))
    new_trailer = save_file(request.files.get('trailer_file'))
    new_sb      = save_file(request.files.get('storyboard_file'))

    thumbnail       = new_thumb   if new_thumb   else existing['thumbnail']
    video_file      = new_video   if new_video   else existing['video_file']
    trailer_file    = new_trailer if new_trailer else existing['trailer_file']
    storyboard_file = new_sb      if new_sb      else existing['storyboard_file']

    conn.execute('''
        UPDATE movies SET title=?, duration=?, status=?, thumbnail=?, video_file=?, trailer_file=?, storyboard_file=?, description=?
        WHERE id=?
    ''', (title, duration, status, thumbnail, video_file, trailer_file, storyboard_file, description, movie_id))
    conn.commit()
    row = conn.execute('SELECT * FROM movies WHERE id = ?', (movie_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/movies/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM movies WHERE id = ?', (movie_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    conn = get_db_connection()
    movie = conn.execute('SELECT * FROM movies WHERE id = ?', (movie_id,)).fetchone()
    conn.close()
    if not movie:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(dict(movie))

# ===== STORYBOARDS =====

@app.route('/api/movies/<int:movie_id>/storyboards', methods=['GET'])
def get_movie_storyboards(movie_id):
    conn = get_db_connection()
    storyboards = conn.execute('SELECT * FROM movie_storyboards WHERE movie_id = ? ORDER BY created_at ASC', (movie_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in storyboards])

@app.route('/api/movies/<int:movie_id>/storyboards', methods=['POST'])
def add_movie_storyboard(movie_id):
    image = save_file(request.files.get('image'))
    if not image:
        return jsonify({'error': 'No image provided'}), 400
    conn = get_db_connection()
    cursor = conn.execute('INSERT INTO movie_storyboards (movie_id, image) VALUES (?, ?)', (movie_id, image))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM movie_storyboards WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/storyboards/<int:sb_id>', methods=['DELETE'])
def delete_storyboard(sb_id):
    conn = get_db_connection()
    sb = conn.execute('SELECT * FROM movie_storyboards WHERE id = ?', (sb_id,)).fetchone()
    if sb and sb['image'] and os.path.exists(sb['image']):
        try: os.remove(sb['image'])
        except: pass
    conn.execute('DELETE FROM movie_storyboards WHERE id = ?', (sb_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ===== MAGAZINES =====

@app.route('/api/magazines', methods=['GET'])
def get_magazines():
    conn = get_db_connection()
    mags = conn.execute('SELECT * FROM magazines ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in mags])

@app.route('/api/magazines', methods=['POST'])
def add_magazine():
    title        = sanitize_input(request.form.get('title'))
    issue_number = request.form.get('issue_number', type=int)
    publish_date = sanitize_input(request.form.get('publish_date'))
    cover_image  = save_file(request.files.get('cover_image'))
    pdf_file     = save_file(request.files.get('pdf_file'))
    
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO magazines (title, issue_number, cover_image, pdf_file, publish_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, issue_number, cover_image, pdf_file, publish_date))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM magazines WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/magazines/<int:mag_id>', methods=['PUT'])
def update_magazine(mag_id):
    title        = sanitize_input(request.form.get('title'))
    issue_number = request.form.get('issue_number', type=int)
    publish_date = sanitize_input(request.form.get('publish_date'))

    conn = get_db_connection()
    existing = conn.execute('SELECT * FROM magazines WHERE id = ?', (mag_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    new_cover = save_file(request.files.get('cover_image'))
    new_pdf   = save_file(request.files.get('pdf_file'))
    cover_image = new_cover if new_cover else existing['cover_image']
    pdf_file    = new_pdf   if new_pdf   else existing['pdf_file']

    conn.execute('''
        UPDATE magazines SET title=?, issue_number=?, cover_image=?, pdf_file=?, publish_date=?
        WHERE id=?
    ''', (title, issue_number, cover_image, pdf_file, publish_date, mag_id))
    conn.commit()
    row = conn.execute('SELECT * FROM magazines WHERE id = ?', (mag_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/magazines/<int:mag_id>', methods=['DELETE'])
def delete_magazine(mag_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM magazines WHERE id = ?', (mag_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ===== CHARACTERS =====

@app.route('/api/movies/<int:movie_id>/characters', methods=['GET'])
def get_movie_characters(movie_id):
    conn = get_db_connection()
    chars = conn.execute('SELECT * FROM characters WHERE movie_id = ? ORDER BY created_at ASC', (movie_id,)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in chars])

@app.route('/api/movies/<int:movie_id>/characters', methods=['POST'])
def add_movie_character(movie_id):
    name        = sanitize_input(request.form.get('name'))
    role        = sanitize_input(request.form.get('role'))
    description = sanitize_input(request.form.get('description'))
    image       = save_file(request.files.get('image'))
    
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO characters (movie_id, name, role, image, description)
        VALUES (?, ?, ?, ?, ?)
    ''', (movie_id, name, role, image, description))
    new_id = cursor.lastrowid
    conn.commit()
    row = conn.execute('SELECT * FROM characters WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/characters/<int:char_id>', methods=['DELETE'])
def delete_character(char_id):
    conn = get_db_connection()
    char = conn.execute('SELECT * FROM characters WHERE id = ?', (char_id,)).fetchone()
    if char and char['image'] and os.path.exists(char['image']):
        try: os.remove(char['image'])
        except: pass
    conn.execute('DELETE FROM characters WHERE id = ?', (char_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ===== OPINIONS =====

@app.route('/api/opinions', methods=['GET'])
def get_opinions():
    conn = get_db_connection()
    opinions = conn.execute('SELECT * FROM opinions ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in opinions])

@app.route('/api/opinions', methods=['POST'])
def add_opinion():
    # Security: Sanitization & Basic Validation
    raw_name    = request.form.get('name')
    raw_message = request.form.get('message')

    # Strong Sanitization
    name    = sanitize_input(raw_name) if raw_name else 'زائر مجهول'
    message = sanitize_input(raw_message) if raw_message else ''

    # Field Length Validation
    if not message or len(message) < 2:
        return jsonify({'error': 'Message too short'}), 400
    if len(message) > 2000:
        return jsonify({'error': 'Message too long'}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO opinions (name, message) VALUES (?, ?)', (name, message))
    conn.commit()
    conn.close()
    return jsonify({'success': True}), 201

@app.route('/api/opinions/<int:op_id>', methods=['DELETE'])
def delete_opinion(op_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM opinions WHERE id = ?', (op_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ===== DEV RELOAD =====
@app.route('/api/dev/reload-check')
def reload_check():
    return jsonify({'server_id': SERVER_ID})

@app.route('/uploads/<path:filename>')
def custom_static(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    # Watch all HTML, CSS, and JS files for changes
    extra_dirs = [
        os.path.join(BASE_DIR, 'css'),
        os.path.join(BASE_DIR, 'js'),
        BASE_DIR # For root HTML files
    ]
    extra_files = []
    for d in extra_dirs:
        for r, ds, fs in os.walk(d):
            for f in fs:
                if f.endswith(('.html', '.css', '.js')):
                    extra_files.append(os.path.join(r, f))

    app.run(host='0.0.0.0', debug=True, port=5000, extra_files=extra_files)
