import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 180 },
  contentType: { type: String, required: true, maxlength: 100 },
  size: { type: Number, required: true, max: 5 * 1024 * 1024 },
  data: { type: Buffer, required: true, select: false },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  category: { type: String, required: true, trim: true, maxlength: 120 },
  abstract: { type: String, required: true, trim: true, maxlength: 12000 },
  keywords: { type: String, trim: true, maxlength: 1000, default: '' },
  attachment: { type: attachmentSchema, required: true },
  status: { type: String, enum: ['submitted', 'in_review', 'revision_requested', 'accepted', 'rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

submissionSchema.index({ owner: 1, updatedAt: -1 });

export default mongoose.model('Submission', submissionSchema);
