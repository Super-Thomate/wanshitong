const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('find')
    .setNameLocalizations({
      fr: 'trouve',
    })
    .setDescription('Find a character or an item')
    .setDescriptionLocalizations({
      fr: 'Trouve un personnage ou un objet',
    })
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The type to find')
        .setDescriptionLocalizations({
          fr: 'Le type à trouver',
        })
        .setRequired(true)
        .addChoices(
          { name: 'Character', value: 'character' },
          { name: 'Item', value: 'item' },
        )
    )
    .addStringOption(option =>
      option.setName('keyword')
        .setNameLocalizations({
          fr: 'mot-clé',
        })
        .setDescription('The keyword to find')
        .setDescriptionLocalizations({
          fr: 'Le mot-clé à trouver',
        })
        .setRequired(true)
    )
    ;


module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.reply('SOON TM');
  }
}