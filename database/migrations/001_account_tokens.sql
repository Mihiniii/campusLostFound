-- Email verification and password reset.
-- Safe to run more than once.

-- Accounts that existed before this change are treated as verified.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
        UPDATE users SET email_verified_at = CURRENT_TIMESTAMP;
    END IF;
END $$;

-- One-time links sent by email. Only a hash of the token is stored.
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,          -- 'verify_email' or 'reset_password'
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
