// Clear guild commands to remove duplicates
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Clearing guild commands...\n');

    if (!process.env.DISCORD_CLIENT_ID) {
      console.error('DISCORD_CLIENT_ID not found in .env');
      process.exit(1);
    }

    const guildIds = process.env.GUILD_IDS?.split(',') || [];

    if (guildIds.length === 0) {
      console.log('No guild IDs provided.');
      console.log('Add GUILD_IDS to your .env file:');
      console.log('GUILD_IDS=guild_id_1,guild_id_2');
      console.log('\nOr run this to clear ALL commands:');
      console.log('node clear-all-commands.js');
      process.exit(0);
    }

    for (const guildId of guildIds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId.trim()),
          { body: [] }
        );
        console.log(`Cleared commands for guild: ${guildId}`);
      } catch (err) {
        console.error(`Failed to clear commands for guild ${guildId}:`, err.message);
      }
    }

    console.log('\nGuild commands cleared!');
    console.log('Now run "node deploy-commands.js" to register global commands.\n');

  } catch (error) {
    console.error('Error:', error);
  }
})();
