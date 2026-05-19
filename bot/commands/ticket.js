const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const { tickets, saveTickets, getNextTicketNumber, findOpenTicket, removeTicket, findTicketByChannel } = require('../utils/ticketStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a support ticket')
        .addStringOption(option =>
          option
            .setName('subject')
            .setDescription('Subject of your ticket')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close your ticket'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Claim a ticket (Staff only)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a ticket channel (Staff only)')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      return await createTicket(interaction);
    }
    if (subcommand === 'close') {
      return await closeTicket(interaction);
    }
    if (subcommand === 'claim') {
      return await claimTicket(interaction);
    }
    if (subcommand === 'delete') {
      return await deleteTicket(interaction);
    }
  }
};

async function createTicket(interaction) {
  const subject = interaction.options.getString('subject');
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  const existing = findOpenTicket(user.id, guild.id);
  if (existing) {
    const existingChannel = guild.channels.cache.get(existing.channelId);
    if (existingChannel) {
      return await interaction.editReply({ content: `You already have an open ticket: ${existingChannel}` });
    }
    existing.status = 'closed';
    saveTickets();
  }

  const ticketNumber = getNextTicketNumber();
  const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;
  const ticketId = `TICKET-${ticketNumber}`;

  let ticketChannel;
  try {
    const botMember = guild.members.me;
    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ];

    if (botMember) {
      permissionOverwrites.push({
        id: botMember.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory]
      });
    }

    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites
    });
  } catch (err) {
    console.error('[Ticket] Channel create error:', err.message);
    return await interaction.editReply({ content: `Failed to create ticket channel: ${err.message}` });
  }

  tickets.set(ticketId, {
    ticketId,
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: user.id,
    username: user.username,
    subject,
    status: 'open',
    claimedBy: null,
    createdAt: new Date().toISOString()
  });
  saveTickets();

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${ticketNumber}`)
    .setDescription(
      `**Welcome to Support!**\n\n` +
      `**Subject:** ${subject}\n` +
      `**User:** <@${user.id}>\n` +
      `**Created:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
      `Describe your issue below. Our team will respond shortly!`
    )
    .setColor(0x00D4AA)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: 'Toolmetry AI Ticket System' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticketId}`)
        .setLabel('Claim')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👋'),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketId}`)
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId(`ticket_delete_${ticketId}`)
        .setLabel('Delete')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🗑️')
    );

  await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });
  await interaction.editReply({ content: `Ticket created: ${ticketChannel}` });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const user = interaction.user;
  const member = interaction.member;

  await interaction.deferReply({ ephemeral: true });

  const ticketData = findTicketByChannel(channel.id);
  if (!ticketData || ticketData.status !== 'open') {
    return await interaction.editReply({ content: 'No open ticket found in this channel.' });
  }

  const isStaff = member?.permissions?.has(PermissionFlagsBits.ManageMessages);
  const isOwner = ticketData.userId === user.id;

  if (!isStaff && !isOwner) {
    return await interaction.editReply({ content: 'Only staff or ticket owner can close this.' });
  }

  const ticket = tickets.get(ticketData.id);
  if (!ticket) {
    return await interaction.editReply({ content: 'Ticket data not found.' });
  }

  ticket.status = 'closed';
  ticket.closedBy = user.id;
  ticket.closedAt = new Date().toISOString();
  saveTickets();

  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const panelMsg = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

    if (panelMsg?.embeds?.[0]) {
      const old = panelMsg.embeds[0];
      const closed = new EmbedBuilder()
        .setTitle(old.title + ' [CLOSED]')
        .setDescription(old.description)
        .setColor(0xEF4444)
        .setThumbnail(old.thumbnail?.url || null)
        .addFields({ name: 'Closed By', value: `<@${user.id}>`, inline: true })
        .setFooter({ text: 'Ticket Closed | Toolmetry AI' })
        .setTimestamp();

      await panelMsg.edit({ embeds: [closed], components: [] });
    }
  } catch (editErr) {
    console.warn('[Ticket] Embed update failed:', editErr.message);
  }

  await channel.send(`Ticket closed by <@${user.id}>. Channel will be deleted in 30 seconds.`);
  await interaction.editReply({ content: 'Ticket closed. Channel will be deleted in 30 seconds.' });

  setTimeout(async () => {
    try {
      await channel.delete('Ticket closed - auto delete');
    } catch (err) {
      console.error('[Ticket] Auto-delete error:', err.message);
    }
    removeTicket(ticketData.id);
  }, 30000);
}

async function claimTicket(interaction) {
  const channel = interaction.channel;
  const member = interaction.member;
  const user = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  const ticketData = findTicketByChannel(channel.id);
  if (!ticketData || ticketData.status !== 'open') {
    return await interaction.editReply({ content: 'No open ticket found in this channel.' });
  }

  if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
    return await interaction.editReply({ content: 'Only staff members can claim tickets.' });
  }

  const ticket = tickets.get(ticketData.id);
  if (!ticket) {
    return await interaction.editReply({ content: 'Ticket data not found.' });
  }

  if (ticket.claimedBy) {
    return await interaction.editReply({ content: 'This ticket is already claimed.' });
  }

  ticket.claimedBy = user.id;
  ticket.claimedAt = new Date().toISOString();
  saveTickets();

  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const panelMsg = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

    if (panelMsg?.embeds?.[0]) {
      const old = panelMsg.embeds[0];
      const updated = new EmbedBuilder()
        .setTitle(old.title)
        .setDescription(old.description)
        .setColor(0x22C55E)
        .setThumbnail(old.thumbnail?.url || null)
        .addFields({ name: 'Claimed By', value: `<@${user.id}>`, inline: true })
        .setFooter({ text: 'Ticket Claimed | Toolmetry AI' })
        .setTimestamp();

      await panelMsg.edit({ embeds: [updated], components: panelMsg.components });
    }
  } catch (editErr) {
    console.warn('[Ticket] Embed update failed:', editErr.message);
  }

  await channel.send(`<@${user.id}> claimed this ticket!`);
  await interaction.editReply({ content: 'You claimed this ticket!' });
}

async function deleteTicket(interaction) {
  const channel = interaction.channel;
  const member = interaction.member;

  await interaction.deferReply({ ephemeral: true });

  if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
    return await interaction.editReply({ content: 'Only staff members can delete tickets.' });
  }

  const ticketData = findTicketByChannel(channel.id);

  await interaction.editReply({ content: 'Deleting ticket...' });

  setTimeout(async () => {
    try {
      await channel.delete('Ticket deleted by staff');
    } catch (err) {
      console.error('[Ticket] Channel delete error:', err.message);
    }
    if (ticketData) removeTicket(ticketData.id);
  }, 2000);
}
