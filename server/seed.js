import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import pool, { initializeDatabase } from './db.js';
import initialIssues from './data/initialIssues.js';

export default async function seedDatabase() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM issues');
  if (Number(total) > 0) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const issue of initialIssues) {
      const publishedAt = new Date(issue.date);
      const mysqlDate = Number.isNaN(publishedAt.getTime()) ? `${issue.year}-01-01 00:00:00` : publishedAt.toISOString().slice(0, 19).replace('T', ' ');
      await connection.execute(
        `INSERT INTO issues (slug, volume, year, type, date_text, published_at, period, cover, title, subtitle, descriptor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [issue.id, issue.volume, issue.year, issue.type || 'regular', issue.date, mysqlDate, issue.period, issue.cover || 'cover-green', issue.title, issue.subtitle || '', issue.descriptor || ''],
      );
      for (const [position, article] of issue.articles.entries()) {
        await connection.execute(
          'INSERT INTO articles (issue_slug, position, category, title, authors, pages) VALUES (?, ?, ?, ?, ?, ?)',
          [issue.id, position, article.category, article.title, article.authors, article.pages || ''],
        );
      }
    }
    await connection.commit();
    console.log(`Seeded ${initialIssues.length} INSAT issues into SQL.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await initializeDatabase();
    await seedDatabase();
  } finally {
    await pool.end();
  }
}
