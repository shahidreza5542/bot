require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease create a .env file with the required variables.');
  console.error('See .env.example for reference.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.set('trust proxy', 1)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(limiter);

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Bot will continue running but database features may be limited.');
  });

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Some features may not work.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Discord Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();
client.events = new Collection();

// Load bot handlers
require('./bot/handlers/commands')(client);
require('./bot/handlers/events')(client);

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Discord Bot Logged In'))
  .catch(err => console.error('Discord Login Error:', err));

// Export client for use in routes
module.exports = { client };

// API Routes (simplified - no payments, no premium checks)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/guilds', require('./routes/guilds'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/embeds', require('./routes/embeds'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: client.user ? 'online' : 'offline',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => res.send('Toolmetry AI Bot is Active 24/7'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
