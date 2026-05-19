require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'bot', 'commands');

console.log('Loading commands for deployment...\n');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`  + /${command.data.name}`);
    } else {
      console.log(`  x ${file} (missing data/execute)`);
    }
  } catch (err) {
    console.error(`  ! ${file} load error:`, err.message);
  }
}

if (!process.env.DISCORD_CLIENT_ID) {
  console.error('\nDISCORD_CLIENT_ID missing in .env');
  process.exit(1);
}

if (!process.env.DISCORD_TOKEN) {
  console.error('\nDISCORD_TOKEN missing in .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\nDeploying ${commands.length} commands...`);
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log(`\nDeployed ${data.length} commands:`);
    data.forEach(cmd => console.log(`  /${cmd.name}`));
    console.log('\nGlobal commands may take up to 1 hour to appear everywhere.');
  } catch (error) {
    console.error('Deploy error:', error);
  }
})();
