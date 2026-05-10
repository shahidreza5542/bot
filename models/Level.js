const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: String,
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  messages: {
    type: Number,
    default: 0
  },
  lastMessage: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Level', levelSchema);
