const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed message (Admin Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Embed title')
        .setRequired(true)
        .setMaxLength(256))
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Embed description/message')
        .setRequired(true)
        .setMaxLength(4096))
    .addStringOption(option =>
      option
        .setName('color')
        .setDescription('Embed color (hex code like #4F46E5)')
        .setRequired(false)
        .setMaxLength(7))
    .addStringOption(option =>
      option
        .setName('footer')
        .setDescription('Footer text')
        .setRequired(false)
        .setMaxLength(2048))
    .addStringOption(option =>
      option
        .setName('footer_image')
        .setDescription('Footer icon URL')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('image')
        .setDescription('Main image URL')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('thumbnail')
        .setDescription('Thumbnail URL')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('author')
        .setDescription('Author name')
        .setRequired(false)
        .setMaxLength(256))
    .addStringOption(option =>
      option
        .setName('author_image')
        .setDescription('Author icon URL')
        .setRequired(false))
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send embed')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const colorInput = interaction.options.getString('color') || '#4F46E5';
    const footer = interaction.options.getString('footer');
    const footerImage = interaction.options.getString('footer_image');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const author = interaction.options.getString('author');
    const authorImage = interaction.options.getString('author_image');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    if (colorInput && !colorInput.match(/^#[0-9A-Fa-f]{6}$/)) {
      return interaction.reply({ content: 'Invalid color format. Use hex like #4F46E5', ephemeral: true });
    }

    const color = parseInt(colorInput.replace('#', ''), 16) || 0x4F46E5;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (footer) {
      const footerData = { text: footer };
      if (footerImage) footerData.iconURL = footerImage;
      embed.setFooter(footerData);
    }

    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);

    if (author) {
      const authorData = { name: author };
      if (authorImage) authorData.iconURL = authorImage;
      embed.setAuthor(authorData);
    }

    await targetChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Embed sent to ${targetChannel}`,
      ephemeral: true
    });
  }
};
