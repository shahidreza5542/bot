const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Toolmetry AI - Bot Commands')
      .setDescription('Your all-in-one Discord bot for fun, moderation, and more!')
      .setColor(0x00D4AA)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp()
      .addFields(
        { name: 'Action Commands (GIF)', value: '`/hug` `/slap` `/kiss` `/pat` `/cuddle` `/poke` `/bite` `/feed` `/tickle` `/highfive` `/dance` `/wave` `/blush` `/smile`', inline: false },
        { name: 'Fun Commands', value: '`/joke` `/meme` `/roast` `/compliment` `/8ball` `/coinflip` `/roll`', inline: false },
        { name: 'Tickets', value: '`/ticket-panel` - Send ticket panel (Admin)\n`/ticket create` - Create a ticket\n`/ticket close` - Close your ticket\n`/ticket claim` - Claim a ticket (Staff)\n`/ticket delete` - Delete ticket (Staff)', inline: false },
        { name: 'Moderation', value: '`/warn` `/ban` `/kick` `/purge`', inline: false },
        { name: 'Leveling', value: '`/rank` `/leaderboard`', inline: false },
        { name: 'Info & Utils', value: '`/serverinfo` `/userinfo` `/avatar` `/help`', inline: false },
        { name: 'Admin Tools', value: '`/role` `/embed` `/say` `/poll` `/welcome` `/activity`', inline: false }
      )
      .setFooter({ text: 'Toolmetry AI Bot | MIT License | No Database Required', iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  }
};
