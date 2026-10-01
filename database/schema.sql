-- Campus Lost & Found: full database schema for a new install.
--
--   createdb campusLostFound
--   psql -d campusLostFound -f database/schema.sql

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',     -- 'student' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified_at TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    title VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL,              -- 'lost' or 'found'
    location VARCHAR(150) NOT NULL,
    item_date DATE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',    -- 'active' or 'returned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude NUMERIC,
    longitude NUMERIC
);

CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'accepted' or 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    receiver_id INTEGER NOT NULL REFERENCES users(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reply_to INTEGER REFERENCES messages(id)
);

-- One-time links sent by email. Only a hash of the token is stored.
CREATE TABLE user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,              -- 'verify_email' or 'reset_password'
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name) VALUES
    ('Electronics'),
    ('Documents'),
    ('Accessories'),
    ('Books'),
    ('Other');
