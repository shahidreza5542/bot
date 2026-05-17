const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const { tickets, saveTickets, getNextTicketNumber } = require('../utils/ticketStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a ticket')
    .addStringOption(option =>
      option.setName('subject')
        .setDescription('Ticket subject')
        .setRequired(true)
    ),

  async execute(interaction) {
    const subject = interaction.options.getString('subject');
    const user = interaction.user;
    const guild = interaction.guild;

    const ticketNumber = getNextTicketNumber();
    const ticketId = `TICKET-${ticketNumber}`;

    const channel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ]
    });

    tickets.set(ticketId, {
      ticketId,
      userId: user.id,
      channelId: channel.id,
      status: 'open',
      subject,
      createdAt: Date.now()
    });

    saveTickets();

    const embed = new EmbedBuilder()
      .setTitle(`🎫 ${ticketId}`)
      .setDescription(`Subject: ${subject}`)
      .setColor(0x00D4AA);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket:claim:${ticketId}`)
        .setLabel('Claim')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`ticket:close:${ticketId}`)
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`ticket:delete:${ticketId}`)
        .setLabel('Delete')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }
};