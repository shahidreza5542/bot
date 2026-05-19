require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const requiredEnvVars = ['DISCORD_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease create a .env file with the required variables.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

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

require('./bot/handlers/commands')(client);
require('./bot/handlers/events')(client);

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Discord Bot Logged In'))
  .catch(err => console.error('Discord Login Error:', err));

module.exports = { client };

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
