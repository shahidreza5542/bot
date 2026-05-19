const { ActivityType } = require('discord.js');
const { loadTickets } = require('../utils/ticketStorage');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Bot logged in as ${client.user.tag}`);

    loadTickets();

    client.user.setActivity('/help | Toolmetry AI Bot', {
      type: ActivityType.Playing
    });

    console.log('Bot is fully ready!');
  }
};
