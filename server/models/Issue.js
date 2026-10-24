import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true, maxlength: 120 },
  title: { type: String, required: true, trim: true, maxlength: 700 },
  authors: { type: String, required: true, trim: true, maxlength: 500 },
  pages: { type: String, trim: true, maxlength: 40, default: '' },
}, { _id: true });

const issueSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]+$/ },
  volume: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true, min: 2000, max: 2100 },
  type: { type: String, enum: ['regular', 'special'], default: 'regular' },
  date: { type: String, required: true, trim: true, maxlength: 100 },
  publishedAt: { type: Date, required: true },
  period: { type: String, required: true, trim: true, maxlength: 120 },
  cover: { type: String, default: 'cover-green', trim: true, maxlength: 50 },
  title: { type: String, required: true, trim: true, maxlength: 240 },
  subtitle: { type: String, default: '', trim: true, maxlength: 300 },
  descriptor: { type: String, default: '', trim: true, maxlength: 500 },
  articles: { type: [articleSchema], default: [] },
}, { timestamps: true, minimize: false });

issueSchema.index({ year: -1, publishedAt: -1 });
issueSchema.index({ type: 1, year: -1 });

export default mongoose.model('Issue', issueSchema);
