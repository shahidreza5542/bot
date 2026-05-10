const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = async (client) => {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  // Ensure commands directory exists
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }
  
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing required properties.`);
    }
  }

  // Register slash commands with Discord
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
    console.log(`Total commands: ${commands.length}`);

    // Register commands globally (can take up to 1 hour to propagate)
    if (process.env.DISCORD_CLIENT_ID) {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log('Successfully reloaded GLOBAL application (/) commands.');
      console.log('Note: Global commands may take up to 1 hour to appear in all servers.');
    }

    // Register commands for specific guilds (instant - for testing)
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
          { body: commands }
        );
        console.log(`✅ Commands registered for guild: ${guild.name} (${guildId})`);
      } catch (guildError) {
        console.error(`❌ Failed to register commands for ${guild.name}:`, guildError.message);
      }
    }

    console.log('\n📋 Available commands:');
    commands.forEach(cmd => console.log(`   /${cmd.name} - ${cmd.description}`));
    
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};
