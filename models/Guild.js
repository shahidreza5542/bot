const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  ownerId: {
    type: String,
    required: true
  },
  // Ticket System Settings
  tickets: {
    enabled: {
      type: Boolean,
      default: false
    },
    categoryId: String,
    transcriptChannelId: String,
    supportRoleIds: [String],
    maxTicketsPerUser: {
      type: Number,
      default: 3
    },
    ticketCounter: {
      type: Number,
      default: 0
    }
  },
  // Welcome/Leave Settings
  welcome: {
    enabled: {
      type: Boolean,
      default: false
    },
    channelId: String,
    message: {
      type: String,
      default: 'Welcome {user} to {server}!'
    },
    embed: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: '#00ff00'
    },
    image: String
  },
  leave: {
    enabled: {
      type: Boolean,
      default: false
    },
    channelId: String,
    message: {
      type: String,
      default: '{user} has left {server}.'
    },
    embed: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: '#ff0000'
    }
  },
  // Moderation Settings
  moderation: {
    logChannelId: String,
    muteRoleId: String,
    warnLimit: {
      type: Number,
      default: 3
    },
    warnAction: {
      type: String,
      enum: ['mute', 'kick', 'ban'],
      default: 'mute'
    },
    autoMod: {
      enabled: {
        type: Boolean,
        default: false
      },
      antiSpam: {
        type: Boolean,
        default: false
      },
      antiLink: {
        type: Boolean,
        default: false
      },
      bannedWords: [String],
      whitelistedChannels: [String]
    }
  },
  // YouTube Notifications
  youtube: {
    enabled: {
      type: Boolean,
      default: false
    },
    channelId: String,
    discordChannelId: String,
    message: {
      type: String,
      default: '🎬 {channel} just uploaded a new video!\n{title}\n{url}'
    },
    lastVideoId: String,
    checkInterval: {
      type: Number,
      default: 5
    }
  },
  // Leveling System
  leveling: {
    enabled: {
      type: Boolean,
      default: false
    },
    channelId: String,
    announceLevelUp: {
      type: Boolean,
      default: true
    },
    roles: [{
      level: Number,
      roleId: String
    }]
  },
  // Custom Prefix
  prefix: {
    type: String,
    default: '/'
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

guildSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Guild', guildSchema);
