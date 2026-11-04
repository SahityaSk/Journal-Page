import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import pool from './db.js';

const router = Router();
const allowedStatuses = ['submitted', 'in_review', 'revision_requested', 'accepted', 'rejected'];

function adminOnly(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const suppliedToken = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!configuredToken) return res.status(503).json({ message: 'Admin access is disabled until ADMIN_TOKEN is configured.' });
  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(suppliedToken || '');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return res.status(401).json({ message: 'A valid admin token is required.' });
  next();
}

function validateIssue(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Provide an issue object.';
  const required = ['volume', 'date', 'period', 'title'];
  const missing = required.filter((field) => typeof input[field] !== 'string' || !input[field].trim());
  if (missing.length) return `Required fields: ${missing.join(', ')}.`;
  if (!Number.isInteger(Number(input.year)) || Number(input.year) < 2000 || Number(input.year) > 2100) return 'Year must be a valid four-digit year.';
  if (input.type && !['regular', 'special'].includes(input.type)) return 'Type must be regular or special.';
  if (!Array.isArray(input.articles)) return 'Articles must be an array.';
  for (const [index, article] of input.articles.entries()) {
    if (!article || typeof article !== 'object' || Array.isArray(article)
      || typeof article.category !== 'string' || !article.category.trim()
      || typeof article.title !== 'string' || !article.title.trim()
      || typeof article.authors !== 'string' || !article.authors.trim()) {
      return `Article ${index + 1} needs a category, title, and author list.`;
    }
    if (article.category.length > 120 || article.title.length > 700 || article.authors.length > 500
      || (article.pages != null && (typeof article.pages !== 'string' || article.pages.length > 40))) {
      return `Article ${index + 1} exceeds the allowed field length.`;
    }
  }
  if (input.articles.length > 500) return 'An issue may contain at most 500 articles.';
  for (const [field, max] of [['volume', 80], ['date', 100], ['period', 120], ['title', 240], ['subtitle', 300], ['descriptor', 500], ['cover', 50]]) {
    if (input[field] != null && (typeof input[field] !== 'string' || input[field].length > max)) return `${field} must be at most ${max} characters.`;
  }
  return null;
}

function normalizeIssue(input) {
  const fallbackSlug = `${input.volume}-${input.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = String(input.slug || fallbackSlug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const dateValue = input.publishedAt ? new Date(input.publishedAt) : new Date(input.date);
  const publishedAt = Number.isNaN(dateValue.getTime()) ? `${Number(input.year)}-01-01 00:00:00` : dateValue.toISOString().slice(0, 19).replace('T', ' ');
  return {
    slug, volume: String(input.volume).trim(), year: Number(input.year), type: input.type || 'regular', date: String(input.date).trim(), publishedAt,
    period: String(input.period).trim(), cover: input.cover || 'cover-green', title: String(input.title).trim(),
    subtitle: input.subtitle || '', descriptor: input.descriptor || '',
    articles: input.articles.map((article) => ({ category: article.category.trim(), title: article.title.trim(), authors: article.authors.trim(), pages: article.pages || '' })),
  };
}

const mapIssue = (row, articles = []) => ({
  slug: row.slug, volume: row.volume, year: Number(row.year), type: row.type, date: row.date_text,
  publishedAt: row.published_at, period: row.period, cover: row.cover, title: row.title,
  subtitle: row.subtitle, descriptor: row.descriptor,
  articles: articles.map((article) => ({ _id: String(article.id), category: article.category, title: article.title, authors: article.authors, pages: article.pages })),
});

async function loadIssues(where = '', values = [], order = 'i.published_at DESC, i.year DESC, i.volume DESC') {
  const [rows] = await pool.execute(`SELECT i.* FROM issues i ${where} ORDER BY ${order}`, values);
  if (!rows.length) return [];
  const placeholders = rows.map(() => '?').join(',');
  const [articleRows] = await pool.execute(`SELECT * FROM articles WHERE issue_slug IN (${placeholders}) ORDER BY position, id`, rows.map((row) => row.slug));
  const grouped = new Map(rows.map((row) => [row.slug, []]));
  for (const article of articleRows) grouped.get(article.issue_slug).push(article);
  return rows.map((row) => mapIssue(row, grouped.get(row.slug)));
}

async function insertArticles(connection, slug, articles) {
  for (const [position, article] of articles.entries()) {
    await connection.execute('INSERT INTO articles (issue_slug, position, category, title, authors, pages) VALUES (?, ?, ?, ?, ?, ?)',
      [slug, position, article.category, article.title, article.authors, article.pages]);
  }
}

async function saveIssue(issue, updateSlug = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (updateSlug) {
      const [existingRows] = await connection.execute('SELECT slug FROM issues WHERE slug=? FOR UPDATE', [updateSlug]);
      if (!existingRows.length) { await connection.rollback(); return null; }
      await connection.execute('DELETE FROM articles WHERE issue_slug=?', [updateSlug]);
      const [result] = await connection.execute(
        `UPDATE issues SET slug=?, volume=?, year=?, type=?, date_text=?, published_at=?, period=?, cover=?, title=?, subtitle=?, descriptor=? WHERE slug=?`,
        [issue.slug, issue.volume, issue.year, issue.type, issue.date, issue.publishedAt, issue.period, issue.cover, issue.title, issue.subtitle, issue.descriptor, updateSlug],
      );
      if (!result.affectedRows && issue.slug !== updateSlug) { await connection.rollback(); return null; }
    } else {
      await connection.execute(
        `INSERT INTO issues (slug, volume, year, type, date_text, published_at, period, cover, title, subtitle, descriptor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [issue.slug, issue.volume, issue.year, issue.type, issue.date, issue.publishedAt, issue.period, issue.cover, issue.title, issue.subtitle, issue.descriptor],
      );
    }
    await insertArticles(connection, issue.slug, issue.articles);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
  return (await loadIssues('WHERE i.slug=?', [issue.slug], 'i.published_at DESC'))[0] || null;
}

function databaseError(error, res, message = 'Could not save the issue.') {
  if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'An issue with this slug already exists.' });
  console.error(error);
  return res.status(500).json({ message });
}

router.get('/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'disconnected' }); }
});

router.get('/issues', async (req, res, next) => {
  try {
    const clauses = [];
    const values = [];
    const year = Number(req.query.year);
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) { clauses.push('i.year=?'); values.push(year); }
    if (['regular', 'special'].includes(req.query.type)) { clauses.push('i.type=?'); values.push(req.query.type); }
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const term = req.query.q.trim().slice(0, 100);
      clauses.push(`(LOCATE(LOWER(?), LOWER(i.title)) > 0 OR LOCATE(LOWER(?), LOWER(i.subtitle)) > 0 OR LOCATE(LOWER(?), LOWER(i.descriptor)) > 0 OR LOCATE(LOWER(?), LOWER(i.volume)) > 0 OR EXISTS (SELECT 1 FROM articles a WHERE a.issue_slug=i.slug AND (LOCATE(LOWER(?), LOWER(a.title)) > 0 OR LOCATE(LOWER(?), LOWER(a.authors)) > 0 OR LOCATE(LOWER(?), LOWER(a.category)) > 0)))`);
      values.push(term, term, term, term, term, term, term);
    }
    const issues = await loadIssues(clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values);
    res.json({ issues });
  } catch (error) { next(error); }
});

router.get('/issues/:slug', async (req, res, next) => {
  try {
    const issue = (await loadIssues('WHERE i.slug=?', [req.params.slug]))[0];
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ issue });
  } catch (error) { next(error); }
});

router.get('/admin/issues', adminOnly, async (_req, res, next) => {
  try { res.json({ issues: await loadIssues('', [], 'i.published_at DESC') }); }
  catch (error) { next(error); }
});

router.post('/admin/issues', adminOnly, async (req, res) => {
  const validation = validateIssue(req.body);
  if (validation) return res.status(400).json({ message: validation });
  try { res.status(201).json({ issue: await saveIssue(normalizeIssue(req.body)) }); }
  catch (error) { databaseError(error, res); }
});

router.put('/admin/issues/:slug', adminOnly, async (req, res) => {
  const validation = validateIssue(req.body);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const issue = await saveIssue(normalizeIssue(req.body), req.params.slug);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ issue });
  } catch (error) { databaseError(error, res); }
});

router.delete('/admin/issues/:slug', adminOnly, async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM issues WHERE slug=?', [req.params.slug]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ message: 'Issue deleted.' });
  } catch (error) { next(error); }
});

router.get('/admin/submissions', adminOnly, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT s.id, s.title, s.category, s.abstract, s.keywords, s.status,
      s.submitted_at AS submittedAt, s.updated_at AS updatedAt, s.attachment_name AS attachmentName,
      s.attachment_type AS attachmentType, s.attachment_size AS attachmentSize, u.name AS authorName, u.email AS authorEmail
      FROM submissions s JOIN users u ON u.id=s.owner_id ORDER BY s.updated_at DESC`);
    res.json({ submissions: rows.map((row) => ({
      id: String(row.id), title: row.title, category: row.category, abstract: row.abstract, keywords: row.keywords,
      status: row.status, submittedAt: row.submittedAt, updatedAt: row.updatedAt,
      attachment: { name: row.attachmentName, contentType: row.attachmentType, size: row.attachmentSize },
      author: { name: row.authorName, email: row.authorEmail },
    })) });
  } catch (error) { next(error); }
});

router.get('/admin/submissions/:id/file', adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT attachment_name, attachment_type, attachment_size, attachment_data FROM submissions WHERE id=?', [req.params.id]);
    const submission = rows[0];
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    res.set({ 'Content-Type': submission.attachment_type, 'Content-Length': submission.attachment_size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(submission.attachment_name)}`,
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    res.send(submission.attachment_data);
  } catch (error) { next(error); }
});

router.put('/admin/submissions/:id/status', adminOnly, async (req, res, next) => {
  if (!allowedStatuses.includes(req.body?.status)) return res.status(400).json({ message: 'Choose a valid review status.' });
  try {
    const [result] = await pool.execute('UPDATE submissions SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Submission not found.' });
    res.json({ status: req.body.status });
  } catch (error) { next(error); }
});

export default router;
