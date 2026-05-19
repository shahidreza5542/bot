require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const missing = ['DISCORD_TOKEN'].filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
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
  .then(() => console.log('Bot logged in'))
  .catch(err => console.error('Login error:', err));

module.exports = { client };

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', bot: client.user ? 'online' : 'offline', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => res.send('Toolmetry AI Bot is Active 24/7'));

app.listen(PORT, () => console.log(`Server on port ${PORT}`));
