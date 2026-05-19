const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

const welcomeSettings = new Map();

module.exports = {
  data: new SlashCommandBuilder().setName('welcome').setDescription('Setup welcome messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand => subcommand.setName('setup').setDescription('Setup welcome message')
      .addChannelOption(option => option.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(option => option.setName('message').setDescription('Welcome message (use {user} and {server})').setRequired(false))
      .addBooleanOption(option => option.setName('embed').setDescription('Send as embed?').setRequired(false))
      .addStringOption(option => option.setName('color').setDescription('Embed color (hex)').setRequired(false))
      .addStringOption(option => option.setName('image').setDescription('Welcome image URL').setRequired(false)))
    .addSubcommand(subcommand => subcommand.setName('disable').setDescription('Disable welcome messages'))
    .addSubcommand(subcommand => subcommand.setName('test').setDescription('Test welcome message')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || 'Welcome {user} to {server}!';
      const useEmbed = interaction.options.getBoolean('embed') ?? true;
      const color = interaction.options.getString('color') || '#00ff00';
      const image = interaction.options.getString('image');

      welcomeSettings.set(guildId, { channelId: channel.id, message, useEmbed, color, image, enabled: true });

      const embed = new EmbedBuilder().setTitle('Welcome System Configured').setDescription(`Welcome messages will be sent to ${channel}`)
        .addFields({ name: 'Message', value: message, inline: false }, { name: 'Embed', value: useEmbed ? 'Yes' : 'No', inline: true }, { name: 'Color', value: color, inline: true })
        .setColor(parseInt(color.replace('#', ''), 16) || 0x00ff00).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === 'disable') {
      const settings = welcomeSettings.get(guildId);
      if (settings) { settings.enabled = false; welcomeSettings.set(guildId, settings); }
      await interaction.reply('Welcome messages disabled');
    } else if (subcommand === 'test') {
      const settings = welcomeSettings.get(guildId);
      if (!settings || !settings.enabled) return interaction.reply('Welcome system not configured. Use `/welcome setup` first.');
      const channel = interaction.guild.channels.cache.get(settings.channelId);
      if (!channel) return interaction.reply('Welcome channel not found');

      const welcomeMsg = settings.message.replace('{user}', `<@${interaction.user.id}>`).replace('{server}', interaction.guild.name);
      if (settings.useEmbed) {
        const embed = new EmbedBuilder().setTitle('Welcome!').setDescription(welcomeMsg)
          .setColor(parseInt(settings.color.replace('#', ''), 16) || 0x00ff00).setThumbnail(interaction.user.displayAvatarURL()).setTimestamp();
        if (settings.image) embed.setImage(settings.image);
        await channel.send({ embeds: [embed] });
      } else { await channel.send(welcomeMsg); }
      await interaction.reply('Test welcome message sent!');
    }
  }
};

module.exports.welcomeSettings = welcomeSettings;
