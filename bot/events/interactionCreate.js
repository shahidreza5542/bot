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

    } catch (err) {
      console.error('Interaction Error:', err);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Interaction failed',
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
};

// ================= BUTTON ROUTER =================
async function handleButton(interaction) {
  try {
    const id = interaction.customId;

    // CREATE
    if (id === 'ticket_create') {
      return await handleTicketCreate(interaction);
    }

    // VALIDATION
    if (!id.includes(':')) {
      return interaction.reply({
        content: '❌ Old or invalid button detected. Recreate panel.',
        ephemeral: true
      });
    }

    const [prefix, action, ticketId] = id.split(':');

    if (prefix !== 'ticket' || !action || !ticketId) {
      return interaction.reply({
        content: '❌ Invalid button format',
        ephemeral: true
      });
    }

    return handleTicketAction(interaction, action, ticketId);

  } catch (err) {
    console.error('Button Error:', err);
  }
}

// ================= CREATE TICKET =================
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    await interaction.deferReply({ ephemeral: true });
  } catch {
    return;
  }

  const existing = [...tickets.values()].find(
    t => t.userId === user.id && t.guildId === guild.id && t.status === 'open'
  );

  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.editReply({
      content: ch ? `❌ Already open: ${ch}` : '❌ Ticket already exists'
    });
  }

  const ticketId = `TICKET-${Date.now()}`;

  let channel;

  try {
    const botMember =
      guild.members.me ||
      await guild.members.fetch(interaction.client.user.id).catch(() => null);

    channel = await guild.channels.create({
      name: `ticket-${Date.now()}`,
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
    .setTitle('🎫 Support Ticket')
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

  return interaction.editReply({
    content: `✅ Ticket created: ${channel}`
  });
}

// ================= ACTION HANDLER =================
async function handleTicketAction(interaction, action, ticketId) {
  let ticket = tickets.get(ticketId);

  if (!ticket) {
    try {
      reloadTickets();
      ticket = tickets.get(ticketId);
    } catch {}
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

  // CLAIM
  if (action === 'claim') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    ticket.claimedBy = user.id;
    saveTickets();

    await channel.send(`👋 Claimed by ${user.tag}`);

    return interaction.reply({
      content: '✅ Claimed',
      ephemeral: true
    });
  }

  // CLOSE
  if (action === 'close') {
    ticket.status = 'closed';
    saveTickets();

    await channel.send(`🔒 Closed by ${user.tag}`);

    return interaction.reply({
      content: '✅ Closed',
      ephemeral: true
    });
  }

  // DELETE
  if (action === 'delete') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ No permission',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '🗑️ Deleting ticket...',
      ephemeral: true
    });

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch {}

      tickets.delete(ticketId);
      saveTickets();
    }, 2000);
  }
}