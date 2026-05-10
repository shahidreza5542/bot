const express = require('express');
const router = express.Router();
const Warning = require('../models/Warning');
const Ban = require('../models/Ban');
const Guild = require('../models/Guild');
const { auth, adminOnly } = require('../middleware/auth');
const { client } = require('../server');

// @route   GET /api/moderation/guild/:guildId/warnings
// @desc    Get warnings for guild
router.get('/guild/:guildId/warnings', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, page = 1, limit = 20 } = req.query;

    const query = { guildId };
    if (userId) query.userId = userId;

    const warnings = await Warning.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Warning.countDocuments(query);

    res.json({
      warnings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch warnings' });
  }
});

// @route   POST /api/moderation/guild/:guildId/warn
// @desc    Warn a user
router.post('/guild/:guildId/warn', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, reason, points = 1, duration } = req.body;

    const warning = new Warning({
      guildId,
      userId,
      moderatorId: req.user.discordId,
      reason,
      points,
      expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
    });

    await warning.save();

    // Check if user has exceeded warn limit
    const guild = await Guild.findOne({ guildId });
    if (guild) {
      const activeWarnings = await Warning.countDocuments({ 
        guildId, 
        userId, 
        active: true 
      });

      if (activeWarnings >= guild.moderation?.warnLimit) {
        // Auto-action
        const botGuild = client.guilds.cache.get(guildId);
        if (botGuild) {
          const member = await botGuild.members.fetch(userId).catch(() => null);
          if (member) {
            const action = guild.moderation?.warnAction || 'mute';
            
            if (action === 'kick') {
              await member.kick(`Auto-kick: Reached ${activeWarnings} warnings`);
            } else if (action === 'ban') {
              await member.ban({ reason: `Auto-ban: Reached ${activeWarnings} warnings` });
            }
          }
        }
      }
    }

    // Send DM to user
    try {
      const user = await client.users.fetch(userId);
      await user.send(`You have been warned in a server for: ${reason}`);
    } catch {}

    res.json({ warning, activeWarnings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to warn user' });
  }
});

// @route   DELETE /api/moderation/warnings/:warningId
// @desc    Remove a warning
router.delete('/warnings/:warningId', auth, async (req, res) => {
  try {
    const warning = await Warning.findByIdAndUpdate(
      req.params.warningId,
      { active: false },
      { new: true }
    );

    if (!warning) {
      return res.status(404).json({ error: 'Warning not found' });
    }

    res.json(warning);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove warning' });
  }
});

// @route   GET /api/moderation/guild/:guildId/bans
// @desc    Get bans for guild
router.get('/guild/:guildId/bans', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 20, active = 'true' } = req.query;

    const query = { guildId };
    if (active === 'true') query.active = true;

    const bans = await Ban.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Ban.countDocuments(query);

    res.json({
      bans,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bans' });
  }
});

// @route   POST /api/moderation/guild/:guildId/ban
// @desc    Ban a user
router.post('/guild/:guildId/ban', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, reason, duration, deleteMessages = 0 } = req.body;

    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const member = await botGuild.members.fetch(userId).catch(() => null);
    
    // Ban in Discord
    await botGuild.members.ban(userId, { 
      deleteMessageDays: deleteMessages,
      reason: `${reason} | By: ${req.user.username}` 
    });

    // Save to database
    const ban = new Ban({
      guildId,
      userId,
      username: member?.user?.username || 'Unknown',
      moderatorId: req.user.discordId,
      reason,
      type: duration ? 'tempban' : 'ban',
      expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
    });

    await ban.save();

    res.json(ban);
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// @route   POST /api/moderation/guild/:guildId/unban
// @desc    Unban a user
router.post('/guild/:guildId/unban', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, reason } = req.body;

    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    await botGuild.members.unban(userId, `${reason} | By: ${req.user.username}`);

    const ban = await Ban.findOneAndUpdate(
      { guildId, userId, active: true },
      { 
        active: false, 
        unbannedAt: new Date(),
        unbannedBy: req.user.discordId,
        unbanReason: reason
      },
      { new: true }
    );

    res.json(ban);
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// @route   POST /api/moderation/guild/:guildId/kick
// @desc    Kick a user
router.post('/guild/:guildId/kick', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, reason } = req.body;

    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const member = await botGuild.members.fetch(userId);
    await member.kick(`${reason} | By: ${req.user.username}`);

    // Log kick
    const kick = new Ban({
      guildId,
      userId,
      username: member.user.username,
      moderatorId: req.user.discordId,
      reason,
      type: 'kick',
      active: false
    });

    await kick.save();

    res.json({ message: 'User kicked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to kick user' });
  }
});

// @route   POST /api/moderation/guild/:guildId/timeout
// @desc    Timeout/mute a user
router.post('/guild/:guildId/timeout', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, duration, reason } = req.body;

    const botGuild = client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const member = await botGuild.members.fetch(userId);
    
    // Duration in minutes to milliseconds
    const timeoutDuration = duration * 60 * 1000;
    await member.timeout(timeoutDuration, `${reason} | By: ${req.user.username}`);

    res.json({ message: `User timed out for ${duration} minutes` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to timeout user' });
  }
});

// @route   GET /api/moderation/guild/:guildId/logs
// @desc    Get moderation logs
router.get('/guild/:guildId/logs', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { type, limit = 50 } = req.query;

    let query = { guildId };
    if (type) query.type = type;

    const [warnings, bans] = await Promise.all([
      Warning.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)),
      Ban.find(query).sort({ createdAt: -1 }).limit(parseInt(limit))
    ]);

    const logs = [...warnings, ...bans]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, parseInt(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
