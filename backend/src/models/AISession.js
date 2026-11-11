/**
 * FinPilot AI - AI Chat Session Model
 * Represents a conversation thread between an MSME user and FinPilot Assistant
 */
const mongoose = require('mongoose');

const aiSessionSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Conversation',
      maxlength: 120,
    },
    modelUsed: {
      type: String,
      default: 'finpilot-rules-engine-v1',
    },
    totalQueries: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for retrieving queries belonging to this session
aiSessionSchema.virtual('queries', {
  ref: 'AIQuery',
  localField: '_id',
  foreignField: 'sessionId',
});

module.exports = mongoose.model('AISession', aiSessionSchema);

