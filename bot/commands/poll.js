const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Poll question')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('option1')
        .setDescription('Option 1')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('option2')
        .setDescription('Option 2')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('option3')
        .setDescription('Option 3')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('option4')
        .setDescription('Option 4')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = [];
    
    for (let i = 1; i <= 4; i++) {
      const option = interaction.options.getString(`option${i}`);
      if (option) options.push(option);
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    let description = '';
    options.forEach((opt, idx) => {
      description += `${emojis[idx]} ${opt}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .setColor(0x5865F2)
      .setFooter({ text: `Poll by ${interaction.user.tag} • React to vote!` })
      .setTimestamp();

    const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
    
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]);
    }
  }
};
