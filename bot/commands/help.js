const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Toolmetry AI - Bot Commands')
      .setDescription('Your all-in-one Discord bot for fun, moderation, and more!')
      .setColor(0x00D4AA)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .addFields(
        {
          name: '💕 Action Commands (GIF)',
          value: '`/hug <user>` - Hug someone\n`/slap <user>` - Slap someone\n`/kiss <user>` - Kiss someone\n`/pat <user>` - Pat someone\n`/cuddle <user>` - Cuddle someone\n`/poke <user>` - Poke someone\n`/bite <user>` - Bite someone\n`/feed <user>` - Feed someone\n`/tickle <user>` - Tickle someone\n`/highfive <user>` - High five!\n`/dance [user]` - Dance!\n`/wave [user]` - Wave hello!\n`/blush [user]` - Show blush!\n`/smile [user]` - Share a smile!',
          inline: false
        },
        {
          name: '😂 Fun Commands',
          value: '`/joke` - Random joke + meme\n`/meme` - Random meme\n`/roast <user>` - Roast someone\n`/compliment <user>` - Compliment someone\n`/8ball <question>` - AI Magic 8-Ball\n`/coinflip` - Flip a coin\n`/roll [sides]` - Roll dice',
          inline: false
        },
        {
          name: '🎫 Tickets',
          value: '`/ticket-panel` - Send ticket panel (Admin)\n`/ticket <subject>` - Create a ticket',
          inline: false
        },
        {
          name: '🛡️ Moderation',
          value: '`/warn <user> [reason]` - Warn a user\n`/ban <user> [reason]` - Ban a user\n`/kick <user> [reason]` - Kick a user\n`/purge <amount>` - Delete messages',
          inline: false
        },
        {
          name: '📊 Leveling',
          value: '`/rank [user]` - Check rank card\n`/leaderboard` - Server XP leaderboard',
          inline: false
        },
        {
          name: '📋 Info & Utils',
          value: '`/serverinfo` - Server information\n`/userinfo [user]` - User information\n`/avatar [user]` - Show avatar\n`/help` - Show this help',
          inline: false
        },
        {
          name: '🔧 Admin Tools',
          value: '`/role add/remove/all` - Manage roles\n`/embed` - Create custom embed\n`/say <message>` - Bot says message\n`/poll` - Create a poll\n`/welcome setup/disable/test` - Welcome system\n`/activity` - Server activity commands',
          inline: false
        }
      )
      .setFooter({
        text: 'Toolmetry AI Bot • No Database Required • Local Storage Based',
        iconURL: interaction.client.user.displayAvatarURL()
      });

    await interaction.reply({ embeds: [embed] });
  }
};
