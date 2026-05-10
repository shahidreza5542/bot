const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../../models/Level');

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
    
    try {
      let levelData = await Level.findOne({
        guildId: interaction.guild.id,
        userId: targetUser.id
      });

      if (!levelData) {
        levelData = {
          level: 1,
          xp: 0,
          messages: 0
        };
      }

      // Calculate rank
      const higherLevels = await Level.countDocuments({
        guildId: interaction.guild.id,
        xp: { $gt: levelData.xp }
      });

      const rank = higherLevels + 1;

      // Calculate XP needed for next level
      const currentLevelXp = 5 * Math.pow(levelData.level, 2) + 50 * levelData.level + 100;
      const nextLevelXp = 5 * Math.pow(levelData.level + 1, 2) + 50 * (levelData.level + 1) + 100;
      const xpNeeded = nextLevelXp - levelData.xp;
      const xpProgress = levelData.xp - currentLevelXp;
      const xpTotalNeeded = nextLevelXp - currentLevelXp;
      const progressPercent = Math.round((xpProgress / xpTotalNeeded) * 100);

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
          { name: 'Messages', value: levelData.messages.toString(), inline: true },
          { name: 'Progress', value: `${progressBar} ${progressPercent}%`, inline: false },
          { name: 'XP to Next Level', value: xpNeeded.toString(), inline: true }
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
