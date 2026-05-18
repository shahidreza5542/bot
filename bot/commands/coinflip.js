const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),

  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '👑' : '🪙';

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Coin Flip`)
      .setDescription(`**${result}**`)
      .setColor(result === 'Heads' ? 0xFFD700 : 0xC0C0C0)
      .setFooter({ text: `Flipped by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
