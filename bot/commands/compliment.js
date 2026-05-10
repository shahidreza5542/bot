const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const compliments = [
  "You're more fun than a ball pit filled with candy!",
  "You are brighter than the sun!",
  "You have the best laugh!"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('compliment')
    .setDescription('Send a compliment to someone')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to compliment')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const compliment = compliments[Math.floor(Math.random() * compliments.length)];

    const embed = new EmbedBuilder()
      .setTitle('Compliment Time!')
      .setDescription(`${targetUser}, ${compliment}`)
      .setColor(0xFF69B4)
      .setFooter({ text: `From ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
