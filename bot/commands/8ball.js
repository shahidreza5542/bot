const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function generateAI8Ball(question) {
  try {
    const prompt = `Answer like a magic 8-ball in short (yes/no/maybe). Question: ${question}`;

    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;

    const res = await axios.get(url, { timeout: 7000 });

    const text =
      typeof res.data === 'string'
        ? res.data
        : res.data?.text || res.data?.result || "The spirits are unclear...";

    return String(text).slice(0, 120);
  } catch (e) {
    const fallback = [
      "It is certain.",
      "Without a doubt.",
      "Yes definitely.",
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Don't count on it.",
      "My reply is no.",
      "Very doubtful.",
      "Signs point to yes.",
      "Most likely.",
      "Outlook good.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      "My sources say no.",
      "Outlook not so good."
    ];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball')
    .addStringOption(o =>
      o.setName('question').setDescription('Your question').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const question = interaction.options.getString('question');
    const answer = await generateAI8Ball(question);

    const embed = new EmbedBuilder()
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: 'Question', value: question.slice(0, 1024) },
        { name: 'Answer', value: answer.slice(0, 1024) }
      )
      .setColor(0x800080)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};