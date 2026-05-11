const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { levelStorage } = require('../utils/localStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your or another user\'s rank')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to check rank for')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guildId = interaction.guild.id;
    
    try {
      const key = `xp-${guildId}-${targetUser.id}`;
      let levelData = levelStorage.get(key);

      // Calculate rank by comparing XP with other users
      const guildLevels = levelStorage.getGuildLevels(guildId);
      const rank = guildLevels.findIndex(u => u.userId === targetUser.id) + 1 || guildLevels.length + 1;

      // Calculate XP needed for next level
      const currentLevelXp = 5 * Math.pow(levelData.level, 2) + 50 * levelData.level + 100;
      const nextLevelXp = 5 * Math.pow(levelData.level + 1, 2) + 50 * (levelData.level + 1) + 100;
      const xpNeeded = nextLevelXp - levelData.xp;
      const xpProgress = levelData.xp;
      const xpTotalNeeded = nextLevelXp - currentLevelXp;
      const progressPercent = Math.min(Math.round((xpProgress / xpTotalNeeded) * 100), 100);

      // Create progress bar
      const progressBarLength = 20;
      const filledLength = Math.round((progressPercent / 100) * progressBarLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

      const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}'s Rank`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Rank', value: `#${rank}`, inline: true },
          { name: 'Level', value: levelData.level.toString(), inline: true },
          { name: 'XP', value: levelData.xp.toString(), inline: true },
          { name: 'Messages', value: (levelData.messages || 0).toString(), inline: true },
          { name: 'Progress', value: `${progressBar} ${progressPercent}%`, inline: false },
          { name: 'XP to Next Level', value: Math.max(0, xpNeeded).toString(), inline: true }
        )
        .setColor(0xFFD700)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching rank:', err);
      await interaction.reply({
        content: 'Failed to fetch rank information.',
        ephemeral: true
      });
    }
  }
};
