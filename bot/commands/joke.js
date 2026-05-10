const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

// Fetch meme from Reddit API
async function fetchMeme(subreddit = 'memes') {
  try {
    const response = await axios.get(`https://meme-api.com/gimme/${subreddit}`, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Meme API Error:', error.message);
    // Fallback to default memes
    return {
      url: "https://i.redd.it/qftn4v55090h1.png",
      title: "Why did the chicken cross the road? To get to the other side!",
      subreddit: "memes",
      postLink: "https://reddit.com/r/memes"
    };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random meme from Reddit')
    .addStringOption(option =>
      option
        .setName('subreddit')
        .setDescription('Subreddit to get meme from')
        .setRequired(false)
        .addChoices(
          { name: 'Memes', value: 'memes' },
          { name: 'DankMemes', value: 'dankmemes' },
          { name: 'Funny', value: 'funny' },
          { name: 'ProgrammerHumor', value: 'ProgrammerHumor' }
        ))
    .addStringOption(option =>
      option
        .setName('delivery')
        .setDescription('How to deliver the meme')
        .setRequired(false)
        .addChoices(
          { name: 'Just me', value: 'personal' },
          { name: 'Mention everyone', value: 'everyone' }
        )),

  async execute(interaction) {
    await interaction.deferReply();
    
    const subreddit = interaction.options.getString('subreddit') || 'memes';
    const delivery = interaction.options.getString('delivery') || 'personal';

    if (delivery === 'everyone' && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply('❌ Only admins can mention everyone!');
    }

    const meme = await fetchMeme(subreddit);

    const embed = new EmbedBuilder()
      .setTitle(meme.title)
      .setDescription(`🎭 From r/${meme.subreddit}`)
      .setImage(meme.url)
      .setURL(meme.postLink)
      .setColor(0xFFD700)
      .setFooter({ text: `👍 ${meme.ups} upvotes • Toolmetry AI Bot` })
      .setTimestamp();

    if (delivery === 'everyone') {
      await interaction.deleteReply();
      await interaction.channel.send({ content: '@everyone', embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }
};

module.exports.fetchMeme = fetchMeme;
