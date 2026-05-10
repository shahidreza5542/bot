const mongoose = require('mongoose');

const embedSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  embed: {
    title: String,
    description: String,
    url: String,
    color: {
      type: String,
      default: '#5865F2'
    },
    timestamp: {
      type: Boolean,
      default: false
    },
    footer: {
      text: String,
      iconURL: String
    },
    image: String,
    thumbnail: String,
    author: {
      name: String,
      url: String,
      iconURL: String
    },
    fields: [{
      name: String,
      value: String,
      inline: {
        type: Boolean,
        default: false
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

embedSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Embed', embedSchema);
