from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os
import uuid

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DB_FILE = os.path.join(BASE_DIR, 'nayzak.db')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables
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
            name TEXT NOT NULL,
            role TEXT,
            image TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the db on startup
init_db()

# --- ROUTES ---

@app.route('/')
def index():
    return app.send_static_file('index.html')

def save_file(file_obj):
    if not file_obj or file_obj.filename == '':
        return None
    ext = os.path.splitext(file_obj.filename)[1]
    filename = str(uuid.uuid4()) + ext
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file_obj.save(filepath)
    return f'uploads/{filename}' # Path to serve it

@app.route('/api/stories', methods=['GET'])
def get_stories():
    conn = get_db_connection()
    stories = conn.execute('SELECT * FROM stories ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in stories])

@app.route('/api/stories', methods=['POST'])
def add_story():
    title = request.form.get('title')
    duration = request.form.get('duration')
    status = request.form.get('status', type=int)
    description = request.form.get('description')
    
    cover_image = save_file(request.files.get('cover_image'))
    audio_file = save_file(request.files.get('audio_file'))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO stories (title, duration, status, cover_image, audio_file, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (title, duration, status, cover_image, audio_file, description))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/movies', methods=['GET'])
def get_movies():
    conn = get_db_connection()
    movies = conn.execute('SELECT * FROM movies ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in movies])

@app.route('/api/movies', methods=['POST'])
def add_movie():
    title = request.form.get('title')
    duration = request.form.get('duration')
    status = request.form.get('status', type=int)
    description = request.form.get('description')
    
    thumbnail = save_file(request.files.get('thumbnail'))
    video_file = save_file(request.files.get('video_file'))
    trailer_file = save_file(request.files.get('trailer_file'))
    storyboard_file = save_file(request.files.get('storyboard_file'))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO movies (title, duration, status, thumbnail, video_file, trailer_file, storyboard_file, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (title, duration, status, thumbnail, video_file, trailer_file, storyboard_file, description))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/characters', methods=['GET'])
def get_characters():
    conn = get_db_connection()
    chars = conn.execute('SELECT * FROM characters ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in chars])

@app.route('/api/characters', methods=['POST'])
def add_character():
    name = request.form.get('name')
    role = request.form.get('role')
    description = request.form.get('description')
    image = save_file(request.files.get('image'))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO characters (name, role, image, description)
        VALUES (?, ?, ?, ?)
    ''', (name, role, image, description))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/magazines', methods=['GET'])
def get_magazines():
    conn = get_db_connection()
    mags = conn.execute('SELECT * FROM magazines ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in mags])

@app.route('/api/magazines', methods=['POST'])
def add_magazine():
    title = request.form.get('title')
    issue_number = request.form.get('issue_number', type=int)
    publish_date = request.form.get('publish_date')
    
    cover_image = save_file(request.files.get('cover_image'))
    pdf_file = save_file(request.files.get('pdf_file'))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO magazines (title, issue_number, cover_image, pdf_file, publish_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, issue_number, cover_image, pdf_file, publish_date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/uploads/<path:filename>')
def custom_static(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
