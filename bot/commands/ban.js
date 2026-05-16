const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { banStorage } = require('../utils/localStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Days until auto-unban (0 for permanent)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(365))
    .addIntegerOption(option =>
      option
        .setName('delete_messages')
        .setDescription('Days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const duration = interaction.options.getInteger('duration') || 0;
    const deleteMessages = interaction.options.getInteger('delete_messages') || 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member) {
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'You cannot ban this user.', ephemeral: true });
      }
      if (!member.bannable) {
        return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
      }
    }

    try {
      await interaction.guild.members.ban(user, {
        deleteMessageDays: deleteMessages,
        reason: `${reason} | By: ${interaction.user.tag}`
      });

      banStorage.add({
        guildId: interaction.guild.id,
        userId: user.id,
        username: user.username,
        moderatorId: interaction.user.id,
        reason,
        type: duration > 0 ? 'tempban' : 'ban',
        expiresAt: duration > 0 ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null
      });

      const embed = new EmbedBuilder()
        .setTitle('🔨 User Banned')
        .setDescription(`${user.tag} has been banned`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: interaction.user.tag },
          { name: 'Duration', value: duration > 0 ? `${duration} days` : 'Permanent' }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('Error banning user:', err);
      await interaction.reply({ content: 'Failed to ban user.', ephemeral: true });
    }
  }
};
