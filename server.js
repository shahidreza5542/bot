require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease create a .env file with the required variables.');
  console.error('See .env.example for reference.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

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

// Export client for use elsewhere
module.exports = { client };

// Health check endpoint
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