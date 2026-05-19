const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { levelStorage } = require('../utils/localStorage');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('View the server XP leaderboard'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    try {
      const guildLevels = levelStorage.getGuildLevels(guildId);
      if (guildLevels.length === 0) return interaction.reply({ content: 'No one has earned XP yet! Start chatting to earn XP!', ephemeral: true });

      const top10 = guildLevels.slice(0, 10);
      const medals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      let description = '';
      for (let i = 0; i < top10.length; i++) {
        description += `${medals[i]} <@${top10[i].userId}> - Level ${top10[i].level} (${top10[i].xp} XP)\n`;
      }

      const embed = new EmbedBuilder().setTitle('Server Leaderboard').setDescription(description).setColor(0xFFD700)
        .setFooter({ text: `${top10.length} members ranked` }).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      await interaction.reply({ content: 'Failed to fetch leaderboard.', ephemeral: true });
    }
  }
};
