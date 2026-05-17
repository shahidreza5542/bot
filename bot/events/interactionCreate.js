const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

const {
  tickets,
  saveTickets,
  reloadTickets
} = require('../utils/ticketStorage');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        return handleButton(interaction);
      }

      if (!interaction.isChatInputCommand()) return;

      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      await command.execute(interaction);

    } catch (error) {
      console.error('Interaction error:', error);

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '❌ Error executing command!',
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: '❌ Error executing command!',
            ephemeral: true
          });
        }
      } catch (e) {}
    }
  }
};


// BUTTON HANDLER

async function handleButton(interaction) {
  if (interaction.replied || interaction.deferred) return;

  const customId = interaction.customId;

  if (customId === 'ticket_create') {
    return handleTicketCreate(interaction);
  }

  if (!customId.startsWith('ticket:')) return;

  const parts = customId.split(':');
  if (parts.length !== 3) return;

  const [, action, ticketId] = parts;

  return handleTicketAction(interaction, action, ticketId);
}

// CREATE TICKET

async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    await interaction.deferReply({ ephemeral: true });
  } catch {
    return;
  }

  // check existing ticket
  const existing = [...tickets.values()].find(
    t => t.userId === user.id && t.guildId === guild.id && t.status === 'open'
  );

  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.editReply({
      content: ch ? `❌ Already open: ${ch}` : '❌ You already have a ticket'
    });
  }

  const ticketNumber = Date.now();
  const ticketId = `TICKET-${ticketNumber}`;

  let channel;

  try {
    const botMember =
      guild.members.me ||
      await guild.members.fetch(interaction.client.user.id).catch(() => null);

    channel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        botMember
          ? {
              id: botMember.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels
              ]
            }
          : null
      ].filter(Boolean)
    });

  } catch (err) {
    console.error(err);
    return interaction.editReply({ content: '❌ Failed to create ticket' });
  }

  tickets.set(ticketId, {
    ticketId,
    userId: user.id,
    guildId: guild.id,
    channelId: channel.id,
    status: 'open',
    createdAt: Date.now()
  });

  saveTickets();

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket`)
    .setDescription(`User: ${user.tag}`)
    .setColor(0x00d4aa);

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

  await channel.send({ content: `${user}`, embeds: [embed], components: [row] });

  return interaction.editReply({ content: `✅ Ticket created: ${channel}` });
}


// ACTION HANDLER

async function handleTicketAction(interaction, action, ticketId) {
  let ticket = tickets.get(ticketId);

  if (!ticket) {
    try {
      reloadTickets();
      ticket = tickets.get(ticketId);
    } catch (e) {
      console.error(e);
    }
  }

  if (!ticket) {
    return interaction.reply({
      content: '❌ Ticket not found',
      ephemeral: true
    });
  }

  const channel = interaction.channel;
  const member = interaction.member;
  const user = interaction.user;

  if (action === 'claim') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    ticket.claimedBy = user.id;
    saveTickets();

    await channel.send(`👋 Claimed by ${user.tag}`);
    return interaction.reply({ content: '✅ Claimed', ephemeral: true });
  }

  if (action === 'close') {
    ticket.status = 'closed';
    saveTickets();

    await channel.send(`🔒 Closed by ${user.tag}`);
    return interaction.reply({ content: '✅ Closed', ephemeral: true });
  }

  if (action === 'delete') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    await interaction.reply({ content: '🗑️ Deleting...', ephemeral: true });

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch {}
      tickets.delete(ticketId);
      saveTickets();
    }, 2000);
  }
}