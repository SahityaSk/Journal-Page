import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import Issue from './models/Issue.js';

const router = Router();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  const required = ['volume', 'year', 'date', 'period', 'title'];
  const missing = required.filter((field) => !String(input[field] ?? '').trim());
  if (missing.length) return `Required fields: ${missing.join(', ')}.`;
  if (!Number.isInteger(Number(input.year)) || Number(input.year) < 2000 || Number(input.year) > 2100) return 'Year must be a valid four-digit year.';
  if (input.type && !['regular', 'special'].includes(input.type)) return 'Type must be regular or special.';
  if (!Array.isArray(input.articles)) return 'Articles must be an array.';
  for (const [index, article] of input.articles.entries()) {
    if (!article?.category?.trim() || !article?.title?.trim() || !article?.authors?.trim()) return `Article ${index + 1} needs a category, title, and author list.`;
  }
  return null;
}

function normalizeIssue(input) {
  const fallbackSlug = `${input.volume}-${input.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = String(input.slug || fallbackSlug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const parsedDate = input.publishedAt ? new Date(input.publishedAt) : new Date(input.date);
  return {
    slug,
    volume: String(input.volume).trim(),
    year: Number(input.year),
    type: input.type || 'regular',
    date: String(input.date).trim(),
    publishedAt: Number.isNaN(parsedDate.getTime()) ? new Date(Number(input.year), 0, 1) : parsedDate,
    period: String(input.period).trim(),
    cover: input.cover || 'cover-green',
    title: String(input.title).trim(),
    subtitle: input.subtitle || '',
    descriptor: input.descriptor || '',
    articles: input.articles.map((article) => ({
      category: article.category.trim(), title: article.title.trim(), authors: article.authors.trim(), pages: article.pages || '',
    })),
  };
}

function handleValidationError(error, res) {
  if (error.name === 'ValidationError' || error.code === 11000) {
    const message = error.code === 11000 ? 'An issue with this slug already exists.' : error.message;
    return res.status(400).json({ message });
  }
  return res.status(500).json({ message: 'Could not save the issue.' });
}

router.get('/health', (_req, res) => res.json({ status: 'ok', database: 'connected' }));

router.get('/issues', async (req, res, next) => {
  try {
    const filter = {};
    const year = Number(req.query.year);
    if (Number.isInteger(year) && year >= 2000 && year <= 2100) filter.year = year;
    if (['regular', 'special'].includes(req.query.type)) filter.type = req.query.type;
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const term = new RegExp(escapeRegex(req.query.q.trim().slice(0, 100)), 'i');
      filter.$or = [
        { title: term }, { subtitle: term }, { descriptor: term }, { volume: term },
        { 'articles.title': term }, { 'articles.authors': term }, { 'articles.category': term },
      ];
    }
    const issues = await Issue.find(filter).sort({ publishedAt: -1, year: -1, volume: -1 }).lean();
    res.json({ issues });
  } catch (error) { next(error); }
});

router.get('/issues/:slug', async (req, res, next) => {
  try {
    const issue = await Issue.findOne({ slug: req.params.slug }).lean();
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ issue });
  } catch (error) { next(error); }
});

router.get('/admin/issues', adminOnly, async (_req, res, next) => {
  try { res.json({ issues: await Issue.find().sort({ publishedAt: -1 }).lean() }); }
  catch (error) { next(error); }
});

router.post('/admin/issues', adminOnly, async (req, res) => {
  const validation = validateIssue(req.body);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const issue = await Issue.create(normalizeIssue(req.body));
    res.status(201).json({ issue });
  } catch (error) { handleValidationError(error, res); }
});

router.put('/admin/issues/:slug', adminOnly, async (req, res) => {
  const validation = validateIssue(req.body);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const issue = await Issue.findOneAndUpdate({ slug: req.params.slug }, normalizeIssue(req.body), { new: true, runValidators: true });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ issue });
  } catch (error) { handleValidationError(error, res); }
});

router.delete('/admin/issues/:slug', adminOnly, async (req, res, next) => {
  try {
    const issue = await Issue.findOneAndDelete({ slug: req.params.slug });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ message: 'Issue deleted.' });
  } catch (error) { next(error); }
});

export default router;
