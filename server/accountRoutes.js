import { Router } from 'express';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import User from './models/User.js';
import Submission from './models/Submission.js';

const router = Router();
const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const authAttempts = new Map();

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });
const publicSubmission = (submission) => ({
  id: submission._id,
  title: submission.title,
  category: submission.category,
  abstract: submission.abstract,
  keywords: submission.keywords,
  status: submission.status,
  submittedAt: submission.submittedAt,
  createdAt: submission.createdAt,
  updatedAt: submission.updatedAt,
  attachment: submission.attachment ? { name: submission.attachment.name, contentType: submission.attachment.contentType, size: submission.attachment.size } : null,
});

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

async function issueSession(user) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  user.sessions = user.sessions.filter((session) => session.expiresAt > new Date());
  user.sessions.push({ tokenHash: hashToken(token), expiresAt });
  await user.save();
  return { token, expiresAt };
}

export async function requireUser(req, res, next) {
  try {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || token.length > 200) return res.status(401).json({ message: 'Please log in to continue.' });
    const user = await User.findOne({ sessions: { $elemMatch: { tokenHash: hashToken(token), expiresAt: { $gt: new Date() } } } });
    if (!user) return res.status(401).json({ message: 'Your session expired. Please log in again.' });
    req.user = user;
    req.sessionTokenHash = hashToken(token);
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
  return { name, contentType: input.file.contentType, size: Buffer.byteLength(input.file.data, 'base64'), data: Buffer.from(input.file.data, 'base64') };
}

router.post('/auth/register', limitAuthAttempts, async (req, res, next) => {
  const validation = validateProfile(req.body?.name, req.body?.email, req.body?.password);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const email = req.body.email.trim().toLowerCase();
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(req.body.password, salt, 64);
    const user = await User.create({ name: req.body.name.trim(), email, passwordHash: `${salt}:${derived.toString('hex')}` });
    const session = await issueSession(user);
    res.status(201).json({ user: publicUser(user), ...session });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account already exists for that email. Log in instead.' });
    next(error);
  }
});

router.post('/auth/login', limitAuthAttempts, async (req, res, next) => {
  if (typeof req.body?.email !== 'string' || typeof req.body?.password !== 'string') return res.status(400).json({ message: 'Enter your email and password.' });
  try {
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const [salt, storedHex] = user.passwordHash.split(':');
    const storedHash = Buffer.from(storedHex || '', 'hex');
    const suppliedHash = await scrypt(req.body.password, salt, 64);
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const session = await issueSession(user);
    res.json({ user: publicUser(user), ...session });
  } catch (error) { next(error); }
});

router.get('/auth/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/auth/logout', requireUser, async (req, res, next) => {
  try {
    req.user.sessions = req.user.sessions.filter((session) => session.tokenHash !== req.sessionTokenHash);
    await req.user.save();
    res.json({ message: 'You are logged out.' });
  } catch (error) { next(error); }
});

router.get('/submissions/mine', requireUser, async (req, res, next) => {
  try {
    const submissions = await Submission.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json({ submissions: submissions.map(publicSubmission) });
  } catch (error) { next(error); }
});

router.post('/submissions', requireUser, async (req, res, next) => {
  const validation = validateSubmission(req.body, true);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const submission = await Submission.create({
      owner: req.user._id,
      title: req.body.title.trim(), category: req.body.category.trim(), abstract: req.body.abstract.trim(),
      keywords: (req.body.keywords || '').trim(), attachment: attachmentFrom(req.body), status: 'submitted',
    });
    res.status(201).json({ submission: publicSubmission(submission), message: 'Your manuscript was sent to the editorial office.' });
  } catch (error) { next(error); }
});

router.put('/submissions/:id', requireUser, async (req, res, next) => {
  const validation = validateSubmission(req.body, false);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const submission = await Submission.findOne({ _id: req.params.id, owner: req.user._id });
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    if (['accepted', 'rejected'].includes(submission.status)) return res.status(409).json({ message: 'This submission is closed and can no longer be edited.' });
    submission.title = req.body.title.trim();
    submission.category = req.body.category.trim();
    submission.abstract = req.body.abstract.trim();
    submission.keywords = (req.body.keywords || '').trim();
    if (req.body.file) submission.attachment = attachmentFrom(req.body);
    await submission.save();
    res.json({ submission: publicSubmission(submission), message: 'Your changes were saved.' });
  } catch (error) { next(error); }
});

router.get('/submissions/:id/file', requireUser, async (req, res, next) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, owner: req.user._id }).select('+attachment.data');
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    res.set({
      'Content-Type': submission.attachment.contentType,
      'Content-Length': submission.attachment.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(submission.attachment.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    res.send(submission.attachment.data);
  } catch (error) { next(error); }
});

export default router;
