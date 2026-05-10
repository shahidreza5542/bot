const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      if (user.banExpiresAt && user.banExpiresAt < new Date()) {
        user.isBanned = false;
        user.banReason = null;
        user.banExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({ 
          error: 'You are banned', 
          reason: user.banReason,
          expiresAt: user.banExpiresAt 
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = { auth, adminOnly };
