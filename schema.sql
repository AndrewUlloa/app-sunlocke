-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT UNIQUE NOT NULL,
    email TEXT
);

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT,
    duration INTEGER,
    file_size INTEGER,
    transcript_text TEXT,
    FOREIGN KEY (user_id) REFERENCES profiles(user_id)
); 