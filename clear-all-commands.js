// Clear ALL commands (global + guild) to remove duplicates
require('dotenv').config();
const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Clearing ALL commands...\n');

    if (!process.env.DISCORD_CLIENT_ID) {
      console.error('DISCORD_CLIENT_ID not found in .env');
      process.exit(1);
    }

    console.log('Clearing global commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: [] }
    );
    console.log('Global commands cleared!\n');

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    await client.login(process.env.DISCORD_TOKEN);

    console.log('Clearing guild commands...');
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
          { body: [] }
        );
        console.log(`Cleared commands for guild: ${guild.name} (${guildId})`);
      } catch (err) {
        console.error(`Failed to clear commands for ${guild.name}:`, err.message);
      }
    }

    await client.destroy();

    console.log('\nALL commands cleared!');
    console.log('Now run "node deploy-commands.js" to register global commands.\n');

  } catch (error) {
    console.error('Error:', error);
  }
})();
