const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { tickets, saveTickets, getNextTicketNumber, addTicket, removeTicket, findOpenTicket, findTicketByChannel } = require('../utils/ticketStorage');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isButton()) {
      return handleButton(interaction);
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Error executing command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Error executing command!', ephemeral: true });
        }
      } catch (e) {}
    }
  }
};

async function handleButton(interaction) {
  const customId = interaction.customId;

  if (customId === 'ticket_create') {
    return handleTicketCreate(interaction);
  }

  if (customId.startsWith('ticket_claim_')) {
    return handleTicketButton(interaction, 'claim', customId.slice('ticket_claim_'.length));
  }
  if (customId.startsWith('ticket_close_')) {
    return handleTicketButton(interaction, 'close', customId.slice('ticket_close_'.length));
  }
  if (customId.startsWith('ticket_delete_')) {
    return handleTicketButton(interaction, 'delete', customId.slice('ticket_delete_'.length));
  }
}

async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (err) {
    try {
      await interaction.reply({ content: 'Failed to process. Please try again.', ephemeral: true });
    } catch (e) {}
    return;
  }

  if (!guild) {
    return await interaction.editReply({ content: 'This can only be used in a server.' });
  }

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

  addTicket(ticketId, {
    ticketId,
    guildId: guild.id,
    channelId: ticketChannel.id,
    userId: user.id,
    username: user.username,
    subject: 'Support Ticket',
    status: 'open',
    claimedBy: null,
    createdAt: new Date().toISOString()
  });

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${ticketNumber}`)
    .setDescription(
      `**Welcome to Support!**\n\n` +
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

async function handleTicketButton(interaction, action, ticketId) {
  const guild = interaction.guild;
  const user = interaction.user;
  const channel = interaction.channel;
  const member = interaction.member;

  let ticket = tickets.get(ticketId);

  if (!ticket) {
    const channelTicket = findTicketByChannel(channel.id);
    if (channelTicket) {
      ticketId = channelTicket.id;
      ticket = channelTicket;
    }
  }

  if (!ticket) {
    try {
      await interaction.reply({ content: 'This ticket no longer exists. It may have been closed or deleted.', ephemeral: true });
    } catch (e) {}
    return;
  }

  if (action === 'claim') {
    return await claimTicketButton(interaction, ticket, ticketId, member, channel, user);
  }
  if (action === 'close') {
    return await closeTicketButton(interaction, ticket, ticketId, member, channel, user);
  }
  if (action === 'delete') {
    return await deleteTicketButton(interaction, ticket, ticketId, member, channel);
  }
}

async function claimTicketButton(interaction, ticket, ticketId, member, channel, user) {
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    return;
  }

  try {
    if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: 'Only staff members can claim tickets.' });
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
  } catch (err) {
    console.error('[Ticket] Claim error:', err.message);
    try { await interaction.editReply({ content: 'Error claiming ticket.' }); } catch (e) {}
  }
}

async function closeTicketButton(interaction, ticket, ticketId, member, channel, user) {
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    return;
  }

  try {
    const isStaff = member?.permissions?.has(PermissionFlagsBits.ManageMessages);
    const isOwner = ticket.userId === user.id;

    if (!isStaff && !isOwner) {
      return await interaction.editReply({ content: 'Only staff or ticket owner can close this.' });
    }

    if (ticket.status === 'closed') {
      return await interaction.editReply({ content: 'This ticket is already closed.' });
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
      removeTicket(ticketId);
    }, 30000);
  } catch (err) {
    console.error('[Ticket] Close error:', err.message);
    try { await interaction.editReply({ content: 'Error closing ticket.' }); } catch (e) {}
  }
}

async function deleteTicketButton(interaction, ticket, ticketId, member, channel) {
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    return;
  }

  try {
    if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: 'Only staff members can delete tickets.' });
    }

    await interaction.editReply({ content: 'Deleting ticket...' });

    setTimeout(async () => {
      try {
        await channel.delete('Ticket deleted by staff');
      } catch (err) {
        console.error('[Ticket] Channel delete error:', err.message);
      }
      removeTicket(ticketId);
    }, 2000);
  } catch (err) {
    console.error('[Ticket] Delete error:', err.message);
    try { await interaction.editReply({ content: 'Error deleting ticket.' }); } catch (e) {}
  }
}
