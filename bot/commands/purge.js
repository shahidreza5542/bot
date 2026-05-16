const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages (Admin Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Amount must be between 1 and 100', ephemeral: true });
    }

    const messages = await interaction.channel.messages.fetch({ limit: amount });

    let deletedCount = 0;

    if (targetUser) {
      const userMessages = messages.filter(m => m.author.id === targetUser.id);
      if (userMessages.size === 0) {
        return interaction.reply({ content: 'No messages found from this user', ephemeral: true });
      }
      await interaction.channel.bulkDelete(userMessages);
      deletedCount = userMessages.size;
    } else {
      await interaction.channel.bulkDelete(messages);
      deletedCount = messages.size;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Messages Deleted')
      .setDescription(`Deleted ${deletedCount} messages`)
      .setColor(0x4F46E5)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
