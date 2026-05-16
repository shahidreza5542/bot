const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { warningStorage } = require('../utils/localStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user (Admin Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to warn')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for warning')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    const warning = {
      reason,
      moderator: interaction.user.tag,
      moderatorId: interaction.user.id
    };

    const userWarnings = warningStorage.add(guildId, targetUser.id, warning);

    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Warning Received')
        .setDescription(`You have been warned in **${interaction.guild.name}**`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warned By', value: interaction.user.tag },
          { name: 'Total Warnings', value: `${userWarnings.length}` }
        )
        .setColor(0x4F46E5)
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log('Could not DM user');
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ User Warned')
      .setDescription(`${targetUser.tag} has been warned`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Warned By', value: interaction.user.tag, inline: true },
        { name: 'Total Warnings', value: `${userWarnings.filter(w => w.active).length}`, inline: true }
      )
      .setColor(0x4F46E5)
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
