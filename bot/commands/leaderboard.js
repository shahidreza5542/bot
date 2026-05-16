const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { levelStorage } = require('../utils/localStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard'),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    try {
      const guildLevels = levelStorage.getGuildLevels(guildId);

      if (guildLevels.length === 0) {
        return interaction.reply({ content: 'No one has earned XP yet! Start chatting to earn XP!', ephemeral: true });
      }

      const top10 = guildLevels.slice(0, 10);

      let description = '';
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];
        description += `${medals[i]} **${user.userId}** - Level ${user.level} (${user.xp} XP)\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Server Leaderboard')
        .setDescription(description)
        .setColor(0xFFD700)
        .setFooter({ text: `${top10.length} members ranked` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      await interaction.reply({ content: 'Failed to fetch leaderboard.', ephemeral: true });
    }
  }
};
