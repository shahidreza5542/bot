const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice or random number')
    .addIntegerOption(option => option.setName('sides').setDescription('Number of sides (default: 6)').setRequired(false).setMinValue(2).setMaxValue(1000000))
    .addIntegerOption(option => option.setName('dice').setDescription('Number of dice (default: 1)').setRequired(false).setMinValue(1).setMaxValue(100))
    .addIntegerOption(option => option.setName('min').setDescription('Min number (range mode)').setRequired(false))
    .addIntegerOption(option => option.setName('max').setDescription('Max number (range mode)').setRequired(false)),

  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const dice = interaction.options.getInteger('dice') || 1;
    const min = interaction.options.getInteger('min');
    const max = interaction.options.getInteger('max');

    if (min !== null && max !== null) {
      if (min >= max) return interaction.reply({ content: 'Minimum must be less than maximum.', ephemeral: true });
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      const embed = new EmbedBuilder().setTitle('Random Number').setDescription(`**${result}**`).addFields({ name: 'Range', value: `${min} - ${max}`, inline: true }).setColor(0x00ff00).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const results = [];
    let total = 0;
    for (let i = 0; i < dice; i++) { const roll = Math.floor(Math.random() * sides) + 1; results.push(roll); total += roll; }

    const embed = new EmbedBuilder().setTitle(`${dice}d${sides} Roll`).setColor(0x00ff00).setTimestamp();
    if (dice === 1) {
      embed.setDescription(`**${results[0]}**`);
      if (results[0] === sides) embed.setFooter({ text: 'Critical hit! Maximum roll!' });
      else if (results[0] === 1) embed.setFooter({ text: 'Critical fail! Minimum roll!' });
    } else {
      embed.setDescription(`**Total: ${total}**\nRolls: ${results.join(', ')}`);
      embed.addFields({ name: 'Average', value: (total / dice).toFixed(2), inline: true }, { name: 'Min', value: Math.min(...results).toString(), inline: true }, { name: 'Max', value: Math.max(...results).toString(), inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
