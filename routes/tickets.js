const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Guild = require('../models/Guild');
const { auth } = require('../middleware/auth');
const { client } = require('../server');

// @route   GET /api/tickets/guild/:guildId
// @desc    Get all tickets for a guild
router.get('/guild/:guildId', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { guildId };
    if (status) query.status = status;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// @route   GET /api/tickets/:ticketId
// @desc    Get specific ticket
router.get('/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// @route   POST /api/tickets/:ticketId/claim
// @desc    Claim a ticket
router.post('/:ticketId/claim', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId, status: 'open' },
      { claimedBy: req.user.discordId },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found or already closed' });
    }

    // Update channel permissions
    const guild = client.guilds.cache.get(ticket.guildId);
    if (guild) {
      const channel = guild.channels.cache.get(ticket.channelId);
      if (channel) {
        await channel.send(`Ticket claimed by <@${req.user.discordId}>`);
      }
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim ticket' });
  }
});

// @route   POST /api/tickets/:ticketId/close
// @desc    Close a ticket
router.post('/:ticketId/close', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId, status: 'open' },
      { 
        status: 'closed',
        closedBy: req.user.discordId,
        closedAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found or already closed' });
    }

    // Delete channel
    const guild = client.guilds.cache.get(ticket.guildId);
    if (guild) {
      const channel = guild.channels.cache.get(ticket.channelId);
      if (channel) {
        await channel.send(`Ticket closed by <@${req.user.discordId}>${reason ? `: ${reason}` : ''}`);
        setTimeout(() => channel.delete('Ticket closed').catch(() => {}), 5000);
      }
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// @route   POST /api/tickets/:ticketId/message
// @desc    Add message to ticket
router.post('/:ticketId/message', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { 
        $push: { 
          messages: {
            author: req.user.username,
            authorId: req.user.discordId,
            content,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Send message to channel
    const guild = client.guilds.cache.get(ticket.guildId);
    if (guild) {
      const channel = guild.channels.cache.get(ticket.channelId);
      if (channel) {
        await channel.send(`**${req.user.username}:** ${content}`);
      }
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// @route   POST /api/tickets/:ticketId/rate
// @desc    Rate a ticket
router.post('/:ticketId/rate', auth, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId, userId: req.user.discordId },
      { rating, feedback },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rate ticket' });
  }
});

// @route   GET /api/tickets/guild/:guildId/stats
// @desc    Get ticket stats for guild
router.get('/guild/:guildId/stats', auth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    const stats = await Ticket.aggregate([
      { $match: { guildId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { 
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          closed: { 
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const recent = await Ticket.find({ guildId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketId subject status createdAt');

    res.json({
      stats: stats[0] || { total: 0, open: 0, closed: 0, avgRating: 0 },
      recent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
