const express = require('express');
const router = express.Router();
const Embed = require('../models/Embed');
const Guild = require('../models/Guild');
const { auth } = require('../middleware/auth');
const { client } = require('../server');
const { EmbedBuilder } = require('discord.js');

// @route   GET /api/embeds/guild/:guildId
// @desc    Get all saved embeds for guild
router.get('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const embeds = await Embed.find({ guildId, userId: req.user.discordId })
      .sort({ createdAt: -1 });

    res.json(embeds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch embeds' });
  }
});

// @route   GET /api/embeds/:embedId
// @desc    Get specific embed
router.get('/:embedId', auth, async (req, res) => {
  try {
    const embed = await Embed.findOne({
      _id: req.params.embedId,
      userId: req.user.discordId
    });

    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }

    res.json(embed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch embed' });
  }
});

// @route   POST /api/embeds
// @desc    Create new embed
router.post('/', auth, async (req, res) => {
  try {
    const { guildId, name, embed } = req.body;

    const newEmbed = new Embed({
      guildId,
      userId: req.user.discordId,
      name,
      embed
    });

    await newEmbed.save();

    res.status(201).json(newEmbed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create embed' });
  }
});

// @route   PUT /api/embeds/:embedId
// @desc    Update embed
router.put('/:embedId', auth, async (req, res) => {
  try {
    const { name, embed } = req.body;

    const updatedEmbed = await Embed.findOneAndUpdate(
      {
        _id: req.params.embedId,
        userId: req.user.discordId
      },
      { name, embed },
      { new: true }
    );

    if (!updatedEmbed) {
      return res.status(404).json({ error: 'Embed not found' });
    }

    res.json(updatedEmbed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update embed' });
  }
});

// @route   DELETE /api/embeds/:embedId
// @desc    Delete embed
router.delete('/:embedId', auth, async (req, res) => {
  try {
    const embed = await Embed.findOneAndDelete({
      _id: req.params.embedId,
      userId: req.user.discordId
    });

    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }

    res.json({ message: 'Embed deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete embed' });
  }
});

// @route   POST /api/embeds/:embedId/preview
// @desc    Preview embed (send to channel)
router.post('/:embedId/preview', auth, async (req, res) => {
  try {
    const { channelId } = req.body;

    const embed = await Embed.findOne({
      _id: req.params.embedId,
      userId: req.user.discordId
    });

    if (!embed) {
      return res.status(404).json({ error: 'Embed not found' });
    }

    const guild = client.guilds.cache.get(embed.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Build Discord embed
    const discordEmbed = buildDiscordEmbed(embed.embed);
    await channel.send({ embeds: [discordEmbed] });

    res.json({ message: 'Embed sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to preview embed' });
  }
});

// @route   POST /api/embeds/send
// @desc    Send embed directly without saving
router.post('/send', auth, async (req, res) => {
  try {
    const { guildId, channelId, embed } = req.body;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const discordEmbed = buildDiscordEmbed(embed);
    const sent = await channel.send({ embeds: [discordEmbed] });

    res.json({ message: 'Embed sent', messageId: sent.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send embed' });
  }
});

// @route   GET /api/embeds/templates
// @desc    Get embed templates
router.get('/templates', auth, (req, res) => {
  const templates = [
    {
      name: 'Welcome',
      embed: {
        title: 'Welcome to {server}!',
        description: 'Thanks for joining {user}, we are glad to have you here!',
        color: '#00ff00',
        thumbnail: '{userAvatar}'
      }
    },
    {
      name: 'Rules',
      embed: {
        title: '📋 Server Rules',
        description: 'Please follow these rules to keep our community safe:',
        color: '#ff9900',
        fields: [
          { name: '1. Be Respectful', value: 'Treat everyone with respect', inline: false },
          { name: '2. No Spam', value: 'Avoid spamming messages', inline: false },
          { name: '3. No NSFW', value: 'Keep content appropriate', inline: false }
        ]
      }
    },
    {
      name: 'Info',
      embed: {
        title: 'ℹ️ Information',
        description: 'Here is some important information:',
        color: '#0099ff',
        fields: [
          { name: 'Support', value: 'Contact @Admin for help', inline: true },
          { name: 'Website', value: 'https://example.com', inline: true }
        ],
        footer: {
          text: 'Last updated'
        },
        timestamp: true
      }
    },
    {
      name: 'Announcement',
      embed: {
        title: '📢 Announcement',
        description: 'We have an important announcement to share with you all!',
        color: '#ff0000',
        image: 'https://via.placeholder.com/800x300'
      }
    },
    {
      name: 'Giveaway',
      embed: {
        title: '🎉 Giveaway!',
        description: 'React with 🎉 to enter!',
        color: '#aa00ff',
        fields: [
          { name: 'Prize', value: 'Amazing Prize!', inline: true },
          { name: 'Ends', value: '24 hours', inline: true },
          { name: 'Hosted by', value: '{user}', inline: true }
        ]
      }
    }
  ];

  res.json(templates);
});

// Helper function to build Discord.js embed
function buildDiscordEmbed(embedData) {
  const embed = new EmbedBuilder();

  if (embedData.title) embed.setTitle(embedData.title);
  if (embedData.description) embed.setDescription(embedData.description);
  if (embedData.url) embed.setURL(embedData.url);
  if (embedData.color) embed.setColor(parseInt(embedData.color.replace('#', ''), 16));
  if (embedData.timestamp) embed.setTimestamp();
  
  if (embedData.footer) {
    embed.setFooter({
      text: embedData.footer.text || '',
      iconURL: embedData.footer.iconURL
    });
  }

  if (embedData.image) embed.setImage(embedData.image);
  if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);

  if (embedData.author) {
    embed.setAuthor({
      name: embedData.author.name || '',
      url: embedData.author.url,
      iconURL: embedData.author.iconURL
    });
  }

  if (embedData.fields && embedData.fields.length > 0) {
    const validFields = embedData.fields
      .filter(f => f.name && f.value)
      .map(f => ({
        name: f.name.substring(0, 256),
        value: f.value.substring(0, 1024),
        inline: f.inline || false
      }));
    
    if (validFields.length > 0) {
      embed.addFields(validFields.slice(0, 25));
    }
  }

  return embed;
}

// @route   POST /api/embeds/validate
// @desc    Validate embed data
router.post('/validate', auth, (req, res) => {
  try {
    const { embed } = req.body;
    const errors = [];

    if (embed.title && embed.title.length > 256) {
      errors.push('Title must be 256 characters or less');
    }

    if (embed.description && embed.description.length > 4096) {
      errors.push('Description must be 4096 characters or less');
    }

    if (embed.fields) {
      if (embed.fields.length > 25) {
        errors.push('Maximum 25 fields allowed');
      }

      embed.fields.forEach((field, index) => {
        if (field.name && field.name.length > 256) {
          errors.push(`Field ${index + 1} name must be 256 characters or less`);
        }
        if (field.value && field.value.length > 1024) {
          errors.push(`Field ${index + 1} value must be 1024 characters or less`);
        }
      });
    }

    if (embed.footer && embed.footer.text && embed.footer.text.length > 2048) {
      errors.push('Footer text must be 2048 characters or less');
    }

    if (embed.author && embed.author.name && embed.author.name.length > 256) {
      errors.push('Author name must be 256 characters or less');
    }

    if (errors.length > 0) {
      return res.status(400).json({ valid: false, errors });
    }

    // Try to build the embed to catch any Discord.js errors
    try {
      buildDiscordEmbed(embed);
      res.json({ valid: true });
    } catch (err) {
      res.status(400).json({ valid: false, errors: [err.message] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;
