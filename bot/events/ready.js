const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Bot logged in as ${client.user.tag}`);

    client.user.setActivity('/help | Toolmetry AI Bot', {
      type: ActivityType.Playing
    });

    console.log('Bot is fully ready!');
  }
};
