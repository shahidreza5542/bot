const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  guildId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: String,
  subject: {
    type: String,
    default: 'No subject'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'deleted'],
    default: 'open'
  },
  messages: [{
    author: String,
    authorId: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],
  claimedBy: {
    type: String,
    default: null
  },
  closedBy: {
    type: String,
    default: null
  },
  closedAt: Date,
  deletedBy: {
    type: String,
    default: null
  },
  deletedAt: Date,
  transcript: [String],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
