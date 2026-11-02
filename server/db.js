import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.SQL_HOST || '127.0.0.1',
  port: Number(process.env.SQL_PORT || 3306),
  user: process.env.SQL_USER || 'insat',
  password: process.env.SQL_PASSWORD || '',
  database: process.env.SQL_DATABASE || 'insat_journal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
});

export default pool;

export async function initializeDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS issues (
    slug VARCHAR(120) PRIMARY KEY,
    volume VARCHAR(80) NOT NULL,
    year SMALLINT NOT NULL,
    type ENUM('regular','special') NOT NULL DEFAULT 'regular',
    date_text VARCHAR(100) NOT NULL,
    published_at DATETIME NOT NULL,
    period VARCHAR(120) NOT NULL,
    cover VARCHAR(50) NOT NULL DEFAULT 'cover-green',
    title VARCHAR(240) NOT NULL,
    subtitle VARCHAR(300) NOT NULL DEFAULT '',
    descriptor VARCHAR(500) NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX issues_publication_order (published_at, year)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS articles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    issue_slug VARCHAR(120) NOT NULL,
    position INT UNSIGNED NOT NULL,
    category VARCHAR(120) NOT NULL,
    title VARCHAR(700) NOT NULL,
    authors VARCHAR(500) NOT NULL,
    pages VARCHAR(40) NOT NULL DEFAULT '',
    CONSTRAINT articles_issue_fk FOREIGN KEY (issue_slug) REFERENCES issues(slug) ON DELETE CASCADE,
    INDEX articles_issue_position (issue_slug, position)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(140) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX sessions_user_expiry (user_id, expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(120) NOT NULL,
    abstract TEXT NOT NULL,
    keywords VARCHAR(1000) NOT NULL DEFAULT '',
    attachment_name VARCHAR(180) NOT NULL,
    attachment_type VARCHAR(100) NOT NULL,
    attachment_size INT UNSIGNED NOT NULL,
    attachment_data MEDIUMBLOB NOT NULL,
    status ENUM('submitted','in_review','revision_requested','accepted','rejected') NOT NULL DEFAULT 'submitted',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT submissions_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX submissions_owner_updated (owner_id, updated_at),
    INDEX submissions_updated (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}
