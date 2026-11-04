import { Router } from 'express';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import pool from './db.js';

const router = Router();
const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const authAttempts = new Map();

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ id: String(user.id), name: user.name, email: user.email });
const mysqlDate = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

function publicSubmission(submission) {
  return {
    id: String(submission.id), title: submission.title, category: submission.category, abstract: submission.abstract,
    keywords: submission.keywords, status: submission.status, submittedAt: submission.submitted_at || submission.submittedAt,
    createdAt: submission.created_at || submission.createdAt, updatedAt: submission.updated_at || submission.updatedAt,
    attachment: submission.attachment_name ? { name: submission.attachment_name, contentType: submission.attachment_type, size: submission.attachment_size } : null,
  };
}

function limitAuthAttempts(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = authAttempts.get(key);
  if (current && current.resetAt > now && current.count >= 12) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many account attempts. Please try again in a few minutes.' });
  }
  if (!current || current.resetAt <= now) authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else current.count += 1;
  if (authAttempts.size > 5000) for (const [ip, entry] of authAttempts) if (entry.resetAt <= now) authAttempts.delete(ip);
  next();
}

async function issueSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await pool.execute('DELETE FROM sessions WHERE user_id=? AND expires_at<=UTC_TIMESTAMP()', [userId]);
  await pool.execute('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [userId, hashToken(token), mysqlDate(expiresAt)]);
  return { token, expiresAt };
}

export async function requireUser(req, res, next) {
  try {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || token.length > 200) return res.status(401).json({ message: 'Please log in to continue.' });
    const [rows] = await pool.execute(`SELECT u.id, u.name, u.email, s.token_hash
      FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() LIMIT 1`, [hashToken(token)]);
    if (!rows[0]) return res.status(401).json({ message: 'Your session expired. Please log in again.' });
    req.user = rows[0];
    req.sessionTokenHash = rows[0].token_hash;
    next();
  } catch (error) { next(error); }
}

function validateProfile(name, email, password) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) return 'Enter your name (up to 120 characters).';
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return 'Use a password between 12 and 128 characters.';
  return null;
}

function validateSubmission(input, needsFile = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Provide submission details.';
  for (const [field, label, max] of [['title', 'Title', 300], ['category', 'Research area', 120], ['abstract', 'Abstract', 12000]]) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].trim().length > max) return `${label} is required and must be at most ${max} characters.`;
  }
  if (typeof (input.keywords || '') !== 'string' || (input.keywords || '').length > 1000) return 'Keywords must be at most 1,000 characters.';
  if (needsFile && !input.file) return 'Attach your manuscript as a PDF, DOC, or DOCX file.';
  if (input.file) {
    if (typeof input.file.name !== 'string' || !input.file.name.trim() || input.file.name.length > 180) return 'Choose a valid manuscript filename.';
    if (!allowedTypes.has(input.file.contentType)) return 'Manuscript files must be PDF, DOC, or DOCX.';
    if (typeof input.file.data !== 'string' || input.file.data.length > Math.ceil(MAX_FILE_SIZE * 4 / 3) + 8) return 'Manuscript file must be 5 MB or smaller.';
    const data = Buffer.from(input.file.data, 'base64');
    if (!data.length || data.length > MAX_FILE_SIZE || data.toString('base64') !== input.file.data) return 'The manuscript file is empty, invalid, or larger than 5 MB.';
    const extension = path.extname(input.file.name).toLowerCase();
    const expectedExtension = { 'application/pdf': '.pdf', 'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx' }[input.file.contentType];
    if (extension !== expectedExtension) return 'The filename extension must match the selected manuscript type.';
  }
  return null;
}

function attachmentFrom(input) {
  const name = path.basename(input.file.name).replace(/[\r\n"\\]/g, '_');
  const data = Buffer.from(input.file.data, 'base64');
  return { name, type: input.file.contentType, size: data.length, data };
}

function submissionFields(input) {
  return [input.title.trim(), input.category.trim(), input.abstract.trim(), (input.keywords || '').trim()];
}

router.post('/auth/register', limitAuthAttempts, async (req, res, next) => {
  const validation = validateProfile(req.body?.name, req.body?.email, req.body?.password);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const email = req.body.email.trim().toLowerCase();
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(req.body.password, salt, 64);
    const [result] = await pool.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [req.body.name.trim(), email, `${salt}:${derived.toString('hex')}`]);
    const user = { id: result.insertId, name: req.body.name.trim(), email };
    const session = await issueSession(user.id);
    res.status(201).json({ user: publicUser(user), ...session });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account already exists for that email. Log in instead.' });
    next(error);
  }
});

router.post('/auth/login', limitAuthAttempts, async (req, res, next) => {
  if (typeof req.body?.email !== 'string' || req.body.email.length > 254
    || typeof req.body?.password !== 'string' || req.body.password.length > 128) {
    return res.status(400).json({ message: 'Enter a valid email and password.' });
  }
  try {
    const [rows] = await pool.execute('SELECT id, name, email, password_hash FROM users WHERE email=? LIMIT 1', [req.body.email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const [salt, storedHex] = user.password_hash.split(':');
    const storedHash = Buffer.from(storedHex || '', 'hex');
    const suppliedHash = await scrypt(req.body.password, salt, 64);
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const session = await issueSession(user.id);
    res.json({ user: publicUser(user), ...session });
  } catch (error) { next(error); }
});

router.get('/auth/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/auth/logout', requireUser, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM sessions WHERE token_hash=?', [req.sessionTokenHash]);
    res.json({ message: 'You are logged out.' });
  } catch (error) { next(error); }
});

router.get('/submissions/mine', requireUser, async (req, res, next) => {
  try {
    const [submissions] = await pool.execute(`SELECT id, title, category, abstract, keywords, status, submitted_at, created_at, updated_at,
      attachment_name, attachment_type, attachment_size FROM submissions WHERE owner_id=? ORDER BY updated_at DESC`, [req.user.id]);
    res.json({ submissions: submissions.map(publicSubmission) });
  } catch (error) { next(error); }
});

router.post('/submissions', requireUser, async (req, res, next) => {
  const validation = validateSubmission(req.body, true);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const attachment = attachmentFrom(req.body);
    const fields = submissionFields(req.body);
    const [result] = await pool.execute(`INSERT INTO submissions
      (owner_id, title, category, abstract, keywords, attachment_name, attachment_type, attachment_size, attachment_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    [req.user.id, ...fields, attachment.name, attachment.type, attachment.size, attachment.data]);
    const [rows] = await pool.execute(`SELECT id, title, category, abstract, keywords, status, submitted_at, created_at, updated_at,
      attachment_name, attachment_type, attachment_size FROM submissions WHERE id=?`, [result.insertId]);
    res.status(201).json({ submission: publicSubmission(rows[0]), message: 'Your manuscript was sent to the editorial office.' });
  } catch (error) { next(error); }
});

router.put('/submissions/:id', requireUser, async (req, res, next) => {
  const validation = validateSubmission(req.body, false);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const [rows] = await pool.execute('SELECT * FROM submissions WHERE id=? AND owner_id=? LIMIT 1', [req.params.id, req.user.id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ message: 'Submission not found.' });
    if (['accepted', 'rejected'].includes(existing.status)) return res.status(409).json({ message: 'This submission is closed and can no longer be edited.' });
    const fields = submissionFields(req.body);
    if (req.body.file) {
      const attachment = attachmentFrom(req.body);
      await pool.execute(`UPDATE submissions SET title=?, category=?, abstract=?, keywords=?, attachment_name=?, attachment_type=?, attachment_size=?, attachment_data=? WHERE id=? AND owner_id=?`,
        [...fields, attachment.name, attachment.type, attachment.size, attachment.data, req.params.id, req.user.id]);
    } else {
      await pool.execute('UPDATE submissions SET title=?, category=?, abstract=?, keywords=? WHERE id=? AND owner_id=?', [...fields, req.params.id, req.user.id]);
    }
    const [updatedRows] = await pool.execute(`SELECT id, title, category, abstract, keywords, status, submitted_at, created_at, updated_at,
      attachment_name, attachment_type, attachment_size FROM submissions WHERE id=?`, [req.params.id]);
    res.json({ submission: publicSubmission(updatedRows[0]), message: 'Your changes were saved.' });
  } catch (error) { next(error); }
});

router.get('/submissions/:id/file', requireUser, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT attachment_name, attachment_type, attachment_size, attachment_data FROM submissions WHERE id=? AND owner_id=?', [req.params.id, req.user.id]);
    const submission = rows[0];
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    res.set({ 'Content-Type': submission.attachment_type, 'Content-Length': submission.attachment_size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(submission.attachment_name)}`,
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    res.send(submission.attachment_data);
  } catch (error) { next(error); }
});

export default router;
