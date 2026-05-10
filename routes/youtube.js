const express = require('express');
const router = express.Router();
const axios = require('axios');
const Parser = require('rss-parser');
const Guild = require('../models/Guild');
const { auth } = require('../middleware/auth');
const { client } = require('../server');

const parser = new Parser();

// YouTube channel ID fetcher
async function getChannelId(identifier) {
  // Check if already an ID (starts with UC)
  if (identifier.startsWith('UC')) {
    return identifier;
  }

  // Handle custom URLs (@username)
  if (identifier.startsWith('@')) {
    try {
      const response = await axios.get(`https://www.youtube.com/${identifier}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Extract channel ID from page source
      const match = response.data.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch {}
  }

  // Handle channel URLs
  if (identifier.includes('youtube.com/channel/')) {
    const match = identifier.match(/channel\/(UC[^/?]+)/);
    if (match) return match[1];
  }

  // Handle user URLs
  if (identifier.includes('youtube.com/user/') || identifier.includes('youtube.com/c/')) {
    try {
      const response = await axios.get(identifier, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const match = response.data.match(/"channelId":"(UC[^"]+)"/);
      if (match) return match[1];
    } catch {}
  }

  return null;
}

// @route   GET /api/youtube/search
// @desc    Search for YouTube channel
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const channelId = await getChannelId(query);

    if (!channelId) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Get channel info via RSS
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    const channelInfo = {
      id: channelId,
      name: feed.title,
      link: feed.link,
      description: feed.description,
      lastVideo: feed.items[0] ? {
        title: feed.items[0].title,
        link: feed.items[0].link,
        published: feed.items[0].isoDate
      } : null
    };

    res.json(channelInfo);
  } catch (err) {
    console.error('YouTube search error:', err);
    res.status(500).json({ error: 'Failed to search channel' });
  }
});

// @route   POST /api/youtube/guild/:guildId/setup
// @desc    Setup YouTube notifications for guild
router.post('/guild/:guildId/setup', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { channelIdentifier, discordChannelId, message } = req.body;

    const channelId = await getChannelId(channelIdentifier);

    if (!channelId) {
      return res.status(404).json({ error: 'YouTube channel not found' });
    }

    // Verify Discord channel exists
    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const channel = botGuild.channels.cache.get(discordChannelId);
    if (!channel) {
      return res.status(404).json({ error: 'Discord channel not found' });
    }

    // Get last video ID
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);
    const lastVideoId = feed.items[0]?.link?.split('v=')[1] || null;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      {
        'youtube.enabled': true,
        'youtube.channelId': channelId,
        'youtube.discordChannelId': discordChannelId,
        'youtube.message': message || '🎬 {channel} just uploaded a new video!\n{title}\n{url}',
        'youtube.lastVideoId': lastVideoId
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'YouTube notifications configured',
      youtube: guild.youtube,
      channelName: feed.title
    });
  } catch (err) {
    console.error('YouTube setup error:', err);
    res.status(500).json({ error: 'Failed to setup YouTube notifications' });
  }
});

// @route   PUT /api/youtube/guild/:guildId
// @desc    Update YouTube settings
router.put('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const updates = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: Object.keys(updates).reduce((acc, key) => {
        acc[`youtube.${key}`] = updates[key];
        return acc;
      }, {}) },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.youtube);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// @route   DELETE /api/youtube/guild/:guildId
// @desc    Disable YouTube notifications
router.delete('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { 'youtube.enabled': false },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({ message: 'YouTube notifications disabled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disable notifications' });
  }
});

// @route   GET /api/youtube/guild/:guildId/status
// @desc    Get YouTube notification status
router.get('/guild/:guildId/status', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guild = await Guild.findOne({ guildId });
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    let latestVideo = null;
    if (guild.youtube?.channelId) {
      try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${guild.youtube.channelId}`;
        const feed = await parser.parseURL(feedUrl);
        latestVideo = feed.items[0] ? {
          title: feed.items[0].title,
          link: feed.items[0].link,
          published: feed.items[0].isoDate,
          id: feed.items[0].link?.split('v=')[1]
        } : null;
      } catch {}
    }

    res.json({
      enabled: guild.youtube?.enabled || false,
      channelId: guild.youtube?.channelId,
      discordChannelId: guild.youtube?.discordChannelId,
      lastChecked: guild.updatedAt,
      latestVideo
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// @route   POST /api/youtube/check/:guildId
// @desc    Manual check for new videos
router.post('/check/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guild = await Guild.findOne({ guildId });
    if (!guild?.youtube?.enabled) {
      return res.status(400).json({ error: 'YouTube notifications not enabled' });
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${guild.youtube.channelId}`;
    const feed = await parser.parseURL(feedUrl);
    
    const latestVideo = feed.items[0];
    if (!latestVideo) {
      return res.json({ message: 'No videos found' });
    }

    const latestVideoId = latestVideo.link?.split('v=')[1];
    
    // Check if new video
    const isNewVideo = latestVideoId !== guild.youtube.lastVideoId;

    if (isNewVideo) {
      // Send notification
      const botGuild = client.guilds.cache.get(guildId);
      const channel = botGuild?.channels.cache.get(guild.youtube.discordChannelId);

      if (channel) {
        const message = guild.youtube.message
          .replace('{channel}', feed.title)
          .replace('{title}', latestVideo.title)
          .replace('{url}', latestVideo.link);

        await channel.send(message);

        // Update last video ID
        guild.youtube.lastVideoId = latestVideoId;
        await guild.save();
      }
    }

    res.json({
      isNewVideo,
      latestVideo: {
        title: latestVideo.title,
        link: latestVideo.link,
        published: latestVideo.isoDate
      }
    });
  } catch (err) {
    console.error('Manual check error:', err);
    res.status(500).json({ error: 'Failed to check for videos' });
  }
});

module.exports = router;
