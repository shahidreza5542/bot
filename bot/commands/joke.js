const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

// Fallback jokes
const fallbackJokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "What do you call a fake noodle? An impasta!",
  "Why did the bicycle fall over? Because it was two-tired!",
  "What do you call a bear with no teeth? A gummy bear!",
  "Why don't eggs tell jokes? They'd crack each other up!",
  "What do you call a fish without eyes? A fsh!",
  "Why did the math book look so sad? Because it had too many problems!",
  "What do you call a dinosaur that crashes their car? Tyrannosaurus Wrecks!",
  "Why did the coffee file a police report? It got mugged!"
];

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
      preview: [
        "https://preview.redd.it/qftn4v55090h1.png?width=640&crop=smart&auto=webp&s=91443426bee29a7f2ec5bab7d7d8f9a6e3260b1c"
      ],
      title: "Why did the chicken cross the road? To get to the other side!",
      subreddit: "memes",
      postLink: "https://reddit.com/r/memes",
      ups: 100
    };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke with image')
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
        .setDescription('How to deliver the joke')
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
    
    // Get preview image (use 640px width for best quality)
    const previewImage = meme.preview && meme.preview.length > 0 
      ? meme.preview[Math.floor(meme.preview.length / 2)] // Use middle preview
      : meme.url;

    // Get random joke from fallback
    const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];

    const embed = new EmbedBuilder()
      .setTitle('🤣 Joke + Meme!')
      .setDescription(`**${randomJoke}**\n\n🎭 Meme: ${meme.title}`)
      .setImage(previewImage)
      .setURL(meme.postLink)
      .setColor(0xFFD700)
      .setFooter({ text: `👍 ${meme.ups} upvotes • r/${meme.subreddit} • Toolmetry AI Bot` })
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
