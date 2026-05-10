const express = require('express');
const router = express.Router();
const axios = require('axios');
const Guild = require('../models/Guild');
const { auth } = require('../middleware/auth');
const { client } = require('../server');

// @route   GET /api/guilds
// @desc    Get user's guilds
router.get('/', auth, async (req, res) => {
  try {
    const { data: guilds } = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${req.user.accessToken}` }
    });

    // Get guilds where user is admin or owner and bot is present
    const userGuilds = guilds.filter(g => (g.permissions & 0x8) === 0x8 || g.owner);
    
    const guildData = await Promise.all(userGuilds.map(async g => {
      const settings = await Guild.findOne({ guildId: g.id });
      const botInGuild = client.guilds.cache.has(g.id);
      
      return {
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        owner: g.owner,
        permissions: g.permissions,
        botInGuild,
        settings: settings || null
      };
    }));

    res.json(guildData);
  } catch (err) {
    console.error('Get guilds error:', err.message);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// @route   GET /api/guilds/:guildId
// @desc    Get specific guild settings
router.get('/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Verify user has access
    const { data: guilds } = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${req.user.accessToken}` }
    });

    const guild = guilds.find(g => g.id === guildId);
    if (!guild || !((guild.permissions & 0x8) === 0x8 || guild.owner)) {
      return res.status(403).json({ error: 'No permission to access this guild' });
    }

    let settings = await Guild.findOne({ guildId });
    
    if (!settings) {
      settings = new Guild({
        guildId,
        name: guild.name,
        icon: guild.icon,
        ownerId: guild.owner ? req.user.discordId : null
      });
      await settings.save();
    }

    // Get bot guild info
    const botGuild = client.guilds.cache.get(guildId);
    const channels = botGuild ? botGuild.channels.cache
      .filter(c => c.type === 0 || c.type === 4)
      .map(c => ({ id: c.id, name: c.name, type: c.type })) : [];
    
    const roles = botGuild ? botGuild.roles.cache
      .filter(r => !r.managed && r.name !== '@everyone')
      .map(r => ({ id: r.id, name: r.name, color: r.color })) : [];

    res.json({
      ...settings.toObject(),
      channels,
      roles,
      botInGuild: !!botGuild
    });
  } catch (err) {
    console.error('Get guild error:', err.message);
    res.status(500).json({ error: 'Failed to fetch guild' });
  }
});

// @route   PUT /api/guilds/:guildId/settings
// @desc    Update guild settings
router.put('/:guildId/settings', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const updates = req.body;

    // Verify access
    const { data: guilds } = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${req.user.accessToken}` }
    });

    const guild = guilds.find(g => g.id === guildId);
    if (!guild || !((guild.permissions & 0x8) === 0x8 || guild.owner)) {
      return res.status(403).json({ error: 'No permission' });
    }

    const settings = await Guild.findOneAndUpdate(
      { guildId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// @route   GET /api/guilds/:guildId/members
// @desc    Get guild members
router.get('/:guildId/members', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;

    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found or bot not in guild' });
    }

    let members = await botGuild.members.fetch();
    
    if (search) {
      members = members.filter(m => 
        m.user.username.toLowerCase().includes(search.toLowerCase()) ||
        m.user.globalName?.toLowerCase().includes(search.toLowerCase()) ||
        m.displayName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = members.size;
    const start = (page - 1) * limit;
    const paginatedMembers = Array.from(members.values())
      .slice(start, start + parseInt(limit))
      .map(m => ({
        id: m.id,
        username: m.user.username,
        discriminator: m.user.discriminator,
        globalName: m.user.globalName,
        displayName: m.displayName,
        avatar: m.user.displayAvatarURL(),
        joinedAt: m.joinedAt,
        roles: m.roles.cache.map(r => ({ id: r.id, name: r.name })),
        isOwner: m.id === botGuild.ownerId
      }));

    res.json({
      members: paginatedMembers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;
