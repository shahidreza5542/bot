const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Guild = require('../models/Guild');
const Level = require('../models/Level');
const { auth, adminOnly } = require('../middleware/auth');
const { client } = require('../server');

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create uploads directory
const fs = require('fs');
if (!fs.existsSync('uploads/avatars')) {
  fs.mkdirSync('uploads/avatars', { recursive: true });
}

// @route   GET /api/settings/me
// @desc    Get user settings
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-accessToken -refreshToken');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// @route   PUT /api/settings/me
// @desc    Update user settings
router.put('/me', auth, async (req, res) => {
  try {
    const { email, customBranding } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (customBranding && req.user.isPaid) {
      updates.customBranding = {
        ...req.user.customBranding,
        ...customBranding,
        enabled: true
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-accessToken -refreshToken');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// @route   POST /api/settings/me/avatar
// @desc    Upload avatar
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-accessToken -refreshToken');

    res.json({ user, avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// @route   GET /api/settings/guild/:guildId
// @desc    Get guild settings
router.get('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const guild = await Guild.findOne({ guildId });
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId
// @desc    Update guild settings
router.put('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const updates = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json(guild);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId/welcome
// @desc    Update welcome settings
router.put('/guild/:guildId/welcome', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const welcomeSettings = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: { welcome: welcomeSettings } },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.welcome);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update welcome settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId/leave
// @desc    Update leave settings
router.put('/guild/:guildId/leave', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const leaveSettings = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: { leave: leaveSettings } },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leave settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId/tickets
// @desc    Update ticket settings
router.put('/guild/:guildId/tickets', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const ticketSettings = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: { tickets: ticketSettings } },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId/moderation
// @desc    Update moderation settings
router.put('/guild/:guildId/moderation', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const moderationSettings = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: { moderation: moderationSettings } },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.moderation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update moderation settings' });
  }
});

// @route   PUT /api/settings/guild/:guildId/leveling
// @desc    Update leveling settings
router.put('/guild/:guildId/leveling', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const levelingSettings = req.body;

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      { $set: { leveling: levelingSettings } },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(guild.leveling);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leveling settings' });
  }
});

// @route   GET /api/settings/guild/:guildId/levels
// @desc    Get guild leveling leaderboard
router.get('/guild/:guildId/levels', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const levels = await Level.find({ guildId })
      .sort({ xp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Level.countDocuments({ guildId });

    // Get Discord user info
    const guild = client.guilds.cache.get(guildId);
    const levelsWithInfo = await Promise.all(levels.map(async (l, index) => {
      const member = guild?.members.cache.get(l.userId);
      return {
        rank: (page - 1) * limit + index + 1,
        userId: l.userId,
        username: l.username || member?.user?.username || 'Unknown',
        avatar: member?.user?.displayAvatarURL() || null,
        level: l.level,
        xp: l.xp,
        messages: l.messages,
        lastMessage: l.lastMessage
      };
    }));

    res.json({
      levels: levelsWithInfo,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// @route   GET /api/settings/guild/:guildId/export
// @desc    Export guild data
router.get('/guild/:guildId/export', auth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const [guild, tickets, warnings, bans, levels] = await Promise.all([
      Guild.findOne({ guildId }),
      Ticket.find({ guildId }),
      Warning.find({ guildId }),
      Ban.find({ guildId }),
      Level.find({ guildId })
    ]);

    const exportData = {
      guild,
      tickets,
      warnings,
      bans,
      levels,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="guild-${guildId}-export.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// @route   POST /api/settings/guild/:guildId/branding
// @desc    Update custom branding (paid only)
router.post('/guild/:guildId/branding', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { customName, customAvatar, enabled } = req.body;

    // Check if user has paid
    const hasPremium = req.user.isPaid && 
      (!req.user.paidExpiresAt || req.user.paidExpiresAt > new Date());

    if (!hasPremium) {
      return res.status(403).json({ error: 'Premium required for custom branding' });
    }

    const guild = await Guild.findOneAndUpdate(
      { guildId },
      {
        $set: {
          'premium.enabled': true,
          'branding.enabled': enabled,
          'branding.customName': customName,
          'branding.customAvatar': customAvatar
        }
      },
      { new: true }
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({
      message: 'Custom branding updated',
      branding: guild.branding
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

module.exports = router;
