const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: String,
  moderatorId: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  },
  type: {
    type: String,
    enum: ['ban', 'tempban', 'kick', 'mute'],
    required: true
  },
  expiresAt: Date,
  unbannedAt: Date,
  unbannedBy: String,
  unbanReason: String,
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ban', banSchema);
