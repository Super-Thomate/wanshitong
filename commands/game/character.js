const { SlashCommandBuilder } = require('discord.js');
const {Personnage, Item, Availability} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('character')
    .setDescription('Show information about a character')
    .addIntegerOption(option => 
      option
        .setName('id')
        .setDescription('Character id')
        .setRequired(true)
        .setMinValue(1)
    )
    ;

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const id = interaction.options.getInteger('id') ;
    const personnage = await Personnage.findOne({
      where: {id: id},
      include: Item
    }) ;
    if (! personnage) {
      return await interaction.editReply(`No character found with id ${id}.`);
    }
    const characterEmbed = {
      color: 0xDDA624,
      title: `${personnage.name} [${interaction.client.getRarityCharacter(personnage.rarity)}]`,
      image: {
        url: personnage.image
      },
      fields: []
    }
    for (const item of personnage.items) {
      characterEmbed.fields.push({
        name: `${interaction.client.getRarityEmoji(item.rarity)} ${interaction.client.getRarityItem(item.rarity)}`,
        value: `#${item.id} ${item.name.upperCaseFirstLetter()}`
      });
    }
    await interaction.editReply({embeds: [characterEmbed]});
  }
}