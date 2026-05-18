// Standalone command deployment script
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'bot', 'commands');

console.log('Loading commands...\n');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`Loaded: ${command.data.name}`);
  } else {
    console.log(`Skipped: ${file} (missing data/execute)`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\nDeploying ${commands.length} commands...\n`);

    if (!process.env.DISCORD_CLIENT_ID) {
      console.error('DISCORD_CLIENT_ID not found in .env');
      console.log('Add this to your .env file:');
      console.log('DISCORD_CLIENT_ID=your_bot_application_id');
      process.exit(1);
    }

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log(`Successfully deployed ${data.length} global commands!`);
    console.log('\nCommand list:');
    data.forEach(cmd => console.log(`   /${cmd.name}`));

    console.log('\nNote: Global commands may take up to 1 hour to appear everywhere.');
    console.log('   For instant results, use the bot in a server.\n');

  } catch (error) {
    console.error('Error:', error);
  }
})();
