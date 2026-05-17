const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme from Reddit'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await axios.get('https://meme-api.com/gimme');
      const meme = response.data;

      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setColor(0xFF4500)
        .setFooter({ text: `From r/${meme.subreddit} • 👍 ${meme.ups}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply('Failed to fetch meme. Try again!');
    }
  }
};
