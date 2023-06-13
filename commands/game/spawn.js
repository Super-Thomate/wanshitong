const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {Configuration, Personnage, Item, Availability, Inventory, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('spawn')
    .setDescription('Spawn a specific character or a totally random one')
    .addSubcommand(subcommand =>
      subcommand
        .setName('random')  
        .setDescription('Spawn a totally random character')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('control')  
        .setDescription('Spawn a random character of given rarity with a specific or random item')
        .addNumberOption(option => 
          option
            .setName('character')
            .setDescription('Character rarity')
            .addChoices(
              {name: 'High', value: 1},
              {name: 'Regular', value: 2},
              {name: 'Low', value: 3},
              {name: 'Event', value: 4}
            )
            .setRequired(true)
        )
        .addNumberOption(option => 
          option
            .setName('item')
            .setDescription('Item rarity')
            .addChoices(
              {name: 'Common', value: 1},
              {name: 'Uncommon', value: 2},
              {name: 'Rare', value: 3},
              {name: 'Epic', value: 4}
            )
            .setRequired(false)
        )
        
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('character')  
        .setDescription('Spawn a character with a specific or random item')
        .addNumberOption(option => 
          option
            .setName('characterid')
            .setDescription('Character id')
            .setMinValue(1)
            .setRequired(true)
        )
        .addNumberOption(option => 
          option
            .setName('item')
            .setDescription('Item rarity')
            .addChoices(
              {name: 'Common', value: 1},
              {name: 'Uncommon', value: 2},
              {name: 'Rare', value: 3},
              {name: 'Epic', value: 4}
            )
            .setRequired(false)
        )
    )
    .setDMPermission(false)
    ;

module.exports = {
  category: 'game',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const action = interaction.options.getSubcommand();
    const guildId = interaction.guildId ;
    const configuration = await Configuration.findOne({where: {guildId: guildId}}) ;
    const dropChannel = await interaction.guild.channels.cache.find(c => c.id === configuration.dropChannel) ;
    if (typeof(dropChannel) === 'undefined' || dropChannel === null) {
      return await interaction.editReply('No channel set for character drop.') ;
    }
    const canDrop = (typeof message.client.alreadyDropped === 'undefined' || typeof message.client.alreadyDropped [message.guild.id] === "undefined" || message.client.alreadyDropped [message.guild.id] === null) ;
    if(!canDrop) {
      return await interaction.editReply('A character is already there, cannot drop.') ;
    }
    if (typeof interaction.client.alreadyDropped === 'undefined') {
      interaction.client.alreadyDropped = {} ;
    }
    interaction.client.alreadyDropped [guildId] = Date.now() ;
    if (action === 'random') {
      try {
       await interaction.client.dropCharacter (dropChannel) ;
       await interaction.editReply(`Spawn a random character`);
      } catch (dropErr) {
        await interaction.editReply({content: dropErr.message}) ;
        console.log (`DROP ERROR: ${dropErr}`) ;
        interaction.client.alreadyDropped [guildId] = null ;
      }
    } else
    if (action === 'control') {
      const character = interaction.options.getNumber('character');
      const item = interaction.options.getNumber('item');
      try {
       await interaction.client.dropCharacter (dropChannel, {
        characterRarity: character,
        itemRarity: item
       }) ;
       await interaction.editReply(`Spawn a controlled character`);
      } catch (dropErr) {
        await interaction.editReply({content: dropErr.message}) ;
        console.log (`DROP ERROR: ${dropErr}`) ;
        interaction.client.alreadyDropped [guildId] = null ;
      }
    } else
    if (action === 'character') {
      const characterid = interaction.options.getNumber('characterid');
      const item = interaction.options.getNumber('item');
      try {
       await interaction.client.dropCharacter (dropChannel, {
        givenId: characterid,
        itemRarity: item
       }) ;
       await interaction.editReply(`Spawn a specific character`);
      } catch (dropErr) {
        await interaction.editReply({content: dropErr.message}) ;
        console.log (`DROP ERROR: ${dropErr}`) ;
        interaction.client.alreadyDropped [guildId] = null ;
      }
    } else {
      await interaction.editReply(`${action} not supported.`);
      interaction.client.alreadyDropped [guildId] = null ;
    }
  }
}