const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  let loaded = 0;

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Command: /${command.data.name}`);
        loaded++;
      } else {
        console.log(`Skip: ${file}`);
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err.message);
    }
  }

  console.log(`Loaded ${loaded} commands`);
};
