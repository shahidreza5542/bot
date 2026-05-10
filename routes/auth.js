const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Discord OAuth2 credentials
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/callback';

// @route   GET /api/auth/discord
// @desc    Redirect to Discord OAuth
router.get('/discord', (req, res) => {
  const scope = 'identify email guilds guilds.members.read';
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(discordAuthUrl);
});

// @route   GET /api/auth/callback
// @desc    Discord OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userResponse.data;

    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id });

    if (user) {
      // Update existing user
      user.username = `${discordUser.username}#${discordUser.discriminator || '0'}`;
      user.avatar = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null;
      user.email = discordUser.email;
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.lastLogin = new Date();
      
      if (user.isBanned) {
        if (user.banExpiresAt && user.banExpiresAt < new Date()) {
          user.isBanned = false;
          user.banReason = null;
          user.banExpiresAt = null;
        } else {
          return res.redirect(`${process.env.CLIENT_URL}/banned?reason=${encodeURIComponent(user.banReason)}`);
        }
      }
      
      await user.save();
    } else {
      // Create new user
      user = new User({
        discordId: discordUser.id,
        username: `${discordUser.username}#${discordUser.discriminator || '0'}`,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
        email: discordUser.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        lastLogin: new Date()
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, discordId: user.discordId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error('Discord OAuth error:', err.response?.data || err.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-accessToken -refreshToken');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', auth, async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// @route   POST /api/auth/refresh
// @desc    Refresh Discord token
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    user.accessToken = tokenResponse.data.access_token;
    user.refreshToken = tokenResponse.data.refresh_token;
    await user.save();

    res.json({ message: 'Token refreshed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;
