const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

async function generateAI8Ball(question) {
  try {
    const prompt = `Answer this question like a mysterious magic 8-ball: "${question}". Give a short mysterious answer (yes/no/maybe style). Keep it under 100 characters.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || "The spirits are unclear...";
  } catch (error) {
    const fallback = [
      "It is certain.", "Without a doubt.", "Yes definitely.",
      "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
      "Don't count on it.", "My reply is no.", "Very doubtful.",
      "Signs point to yes.", "Most likely.", "Outlook good.",
      "Cannot predict now.", "Concentrate and ask again.",
      "My sources say no.", "Outlook not so good."
    ];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the AI magic 8ball a question')
    .addStringOption(option => option.setName('question').setDescription('Your question for the 8ball').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const question = interaction.options.getString('question');
    const answer = await generateAI8Ball(question);

    const embed = new EmbedBuilder()
      .setTitle('AI Magic 8-Ball')
      .addFields(
        { name: 'Question', value: question },
        { name: 'AI Answer', value: `**${answer}**` }
      )
      .setColor(0x800080)
      .setFooter({ text: `Asked by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
