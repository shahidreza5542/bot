const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// In-memory warnings storage (Discord-only)
const warnings = new Map();

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

    // Get or create warnings array for this user
    const userKey = `${guildId}-${targetUser.id}`;
    if (!warnings.has(userKey)) {
      warnings.set(userKey, []);
    }

    const userWarnings = warnings.get(userKey);
    const warnId = userWarnings.length + 1;

    const warning = {
      id: warnId,
      reason,
      moderator: interaction.user.tag,
      moderatorId: interaction.user.id,
      timestamp: new Date()
    };

    userWarnings.push(warning);

    // Send DM to user
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Warning Received')
        .setDescription(`You have been warned in **${interaction.guild.name}**`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warned By', value: interaction.user.tag },
          { name: 'Total Warnings', value: `${userWarnings.length}` }
        )
        .setColor(0x4F46E5) // Indigo 600
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log('Could not DM user');
    }

    // Reply in channel
    const embed = new EmbedBuilder()
      .setTitle('⚠️ User Warned')
      .setDescription(`${targetUser.tag} has been warned`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Warned By', value: interaction.user.tag, inline: true },
        { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true }
      )
      .setColor(0x4F46E5) // Indigo 600
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};

module.exports.warnings = warnings;
