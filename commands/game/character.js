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
    await interaction.editReply('Soon TM');
  }
}