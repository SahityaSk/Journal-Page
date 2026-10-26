import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import Issue from './models/Issue.js';
import initialIssues from './data/initialIssues.js';

function toDocument(issue) {
  const { id, ...fields } = issue;
  return {
    ...fields,
    slug: id,
    publishedAt: new Date(issue.date),
  };
}

export default async function seedDatabase() {
  const existing = await Issue.countDocuments();
  if (existing > 0) return;
  await Issue.insertMany(initialIssues.map(toDocument));
  console.log(`Seeded ${initialIssues.length} INSAT issues.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before running the seed command.');
  await mongoose.connect(process.env.MONGODB_URI);
  await seedDatabase();
  await mongoose.disconnect();
}
