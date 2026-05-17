const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function generateAI8Ball(question) {
  try {
    const prompt = `You are a magic 8-ball. Reply ONLY in a short phrase (yes/no/maybe style). Question: ${question}`;

    const res = await axios.get(
      `https://text.pollinations.ai/?text=${encodeURIComponent(prompt)}`,
      { timeout: 7000 }
    );

    let text = res.data;

    if (typeof text !== 'string') {
      text = text?.text || text?.result || "";
    }

    text = String(text).replace(/\n/g, " ").trim();

    if (!text) return "Ask again later.";

    return text.slice(0, 80);
  } catch (e) {
    const fallback = [
      "It is certain.",
      "Without a doubt.",
      "Yes.",
      "No.",
      "Ask again later.",
      "Very doubtful."
    ];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question')
        .setRequired(true)
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