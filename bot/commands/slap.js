const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const slaps = [
  "https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
  "https://media.giphy.com/media/xT0BKiwgIPGJV3N7rG/giphy.gif",
  "https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif",
  "https://media.giphy.com/media/1HQIBMCt7gZya/giphy.gif",
  "https://media.giphy.com/media/13bxg8lX7aK1y/giphy.gif",
  "https://media.giphy.com/media/j2yWZjX9z6VqI/giphy.gif",
  "https://media.giphy.com/media/3o7TKr3yzb8pQjY0W8/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/1B9l7nqPjKZgs/giphy.gif",
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone (all in good fun!)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to slap')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const slapGif = slaps[Math.floor(Math.random() * slaps.length)];

    const embed = new EmbedBuilder()
      .setTitle('👋 Slap!')
      .setDescription(`${interaction.user} slapped ${targetUser}!`)
      .setImage(slapGif)
      .setColor(0xFF4500)
      .setFooter({ text: 'Toolmetry AI' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
