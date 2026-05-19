const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: /${command.data.name}`);
    } else {
      console.log(`[WARNING] ${file} is missing required properties.`);
    }
  }

  console.log(`\nLoaded ${commandFiles.length} commands into memory`);
};
