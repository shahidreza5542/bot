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

  // Commands are now loaded into memory only
  // Use deploy-commands.js to register them with Discord
  console.log(`\n📋 Loaded ${commands.length} commands into memory`);
  console.log('Note: Run "node deploy-commands.js" to register/update commands with Discord');
};
