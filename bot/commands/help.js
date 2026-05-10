const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Toolmetry AI - Bot Commands')
      .setDescription('Your all-in-one Discord bot for tickets, moderation, and fun!')
      .setColor(0x00D4AA)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .addFields(
        {
          name: '🎫 Tickets',
          value: '`/ticket-panel` - Send branded ticket panel (Admin)',
          inline: false
        },
        {
          name: '🛡️ Moderation',
          value: '`/warn <user> [reason]` - Warn a user\n`/ban <user> [reason]` - Ban a user\n`/kick <user> [reason]` - Kick a user\n`/purge <amount>` - Delete messages',
          inline: false
        },
        {
          name: '🎮 Leveling',
          value: '`/rank [user]` - Check rank card',
          inline: false
        },
        {
          name: '😂 Fun Commands',
          value: '`/joke` - Get a random joke\n`/roast <user>` - Roast someone\n`/compliment <user>` - Compliment someone\n`/8ball <question>` - Ask the magic 8ball\n`/meme` - Get a random meme\n`/coinflip` - Flip a coin\n`/hug <user>` - Hug someone\n`/roll [sides]` - Roll dice',
          inline: false
        },
        {
          name: '📊 Info Commands',
          value: '`/serverinfo` - Server information\n`/userinfo [user]` - User information\n`/help` - Show this help',
          inline: false
        },
        {
          name: '🔥 Admin Activity',
          value: '`/activity mention-all-joke` - Mention everyone with joke\n`/activity mention-all-msg` - Mention everyone with message\n`/activity fun-fact` - Send fun fact to everyone',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Toolmetry AI Bot • Made with love for your server',
        iconURL: interaction.client.user.displayAvatarURL()
      });

    await interaction.reply({ embeds: [embed] });
  }
};
