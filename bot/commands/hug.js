const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const hugs = [
  "https://media.giphy.com/media/od5H3PmEG5Ixn8aMXo/giphy.gif",
  "https://media.giphy.com/media/l4FGpPki5cw1T7gO0U/giphy.gif",
  "https://media.giphy.com/media/3M4NnpLt1L5yK9z94F/giphy.gif",
  "https://media.giphy.com/media/13YqdH3fbS5TE/giphy.gif",
  "https://media.giphy.com/media/L2Q7ip5D8e4I/giphy.gif",
  "https://media.giphy.com/media/5eLAtE69RkklC/giphy.gif",
  "https://media.giphy.com/media/2sXf9AUhQw1Bq/giphy.gif",
  "https://media.giphy.com/media/143v0Y5P3py0H2/giphy.gif",
  "https://media.giphy.com/media/5NTw9xYKzJfPC/giphy.gif",
  "https://media.giphy.com/media/JBCjCk4m6Q3Oc/giphy.gif",
  "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  "https://media.giphy.com/media/PHB7K8Xw6yMxq/giphy.gif",
  "https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif",
  "https://media.giphy.com/media/yFQ0ywsczobbc/giphy.gif"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Hug someone')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to hug')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const hugGif = hugs[Math.floor(Math.random() * hugs.length)];

    const embed = new EmbedBuilder()
      .setTitle('🤗 Hug!')
      .setDescription(`${interaction.user} hugged ${targetUser}!`)
      .setImage(hugGif)
      .setThumbnail(hugGif)
      .setColor(0xFF69B4)
      .setFooter({ text: 'Toolmetry AI' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
