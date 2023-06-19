const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const {Personnage, Item, Availability, Inventory} = require('../../dbObjects.js');
const { Op } = require("sequelize");
const fs = require('node:fs') ;
const { triggerAsyncId } = require('node:async_hooks');


const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Display user inventory')
    .addStringOption(option => 
      option
        .setName('serie')
        .setDescription('Display only items from specific serie or event')
        .setRequired(false)
    )
    .setDMPermission(false)
    ;

const getFields = (personnages, max, client) => {
  const allFields = [] ;
  let field = '' ;
  let currentCharacter = '' ;
  let currentCharacterId = 0 ;
  let currentPage = 0 ;
  let countObjects = 0 ;
  for (const personnage of personnages) {
    // If the array representig the current page does not exist, I create it
    if (allFields[currentPage] === null || !Array.isArray(allFields[currentPage])) {
      allFields[currentPage] = [] ;
    }
    if (currentCharacterId != personnage.id) {
      // I have a new character
      // console.log (`I have a new character: ${invent.item.personnage.name}`) ;
      if (currentCharacter.length) {
        // I already have a character saved, let's add it to the page
        allFields[currentPage].push({name: currentCharacter, "value": field}) ;
      }
      // I create a new character to create
      currentCharacter = personnage.name ;
      currentCharacterId = personnage.id ;
      field = '' ;
    }
    for (const item of personnage.items) {
      // If I have max objects in my field, I start a new page
      if (countObjects == max) {
        // write the end of the page
        //allFields[currentPage].push({name: currentCharacter, "value": field}) ;
        //field = '' ;
        // next page
        currentPage++;
        countObjects = 1;
      } else {
        // I increment the count cause I have a new object
        countObjects++ ;
      }
      // I add the item to the inventory page
      field += `${client.getRarityEmoji (item.rarity)} ${client.getRarityItem (item.rarity)} - ${item.name.upperCaseFirstLetter()}\n` ;
      // console.log (`${item.name.upperCaseFirstLetter()} is item #${countObjects} of page ${currentPage+1}`);
    }
  }
  // return allFields ; // DEBUG
  // I need to write the last character, as they did not have a different id than themself
  if (currentCharacter.length) {
    if (allFields[currentPage] === null || !Array.isArray(allFields[currentPage])) {
      allFields[currentPage] = [] ;
    }
    // console.log(`countObjects: ${countObjects}`);
    allFields[currentPage].push({name: currentCharacter, "value": field}) ;
  }
  return allFields ;
}

const iconEvent = '🎉' ;

module.exports = {
  category: 'game',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    // const action = interaction.options.getSubcommand() ;
    const maxPerPage = 20 ;
    const serie = interaction.options.getString('serie') ;
    const wherePersonnage = {} ;
    if (serie && serie !== 'event') {
      wherePersonnage.serie = serie ;
    } else if (serie === 'event') {
      wherePersonnage.rarity = 4
    } else {
      wherePersonnage.rarity = {[Op.not]: 4}
    }
    const inventory = await Inventory.count({
      where: {[Op.and]:[
        {guildId: interaction.guildId},
        {ownerId: interaction.member.id}
      ]},
      include: {
        model: Item,
        as: 'item',
        required: true,
        include: {
          model: Personnage,
          required: true,
          where: wherePersonnage,
          // include: {
          //   model: Availability,
          //   as: 'availability',
          //   where: {[Op.and]: [{guildId: interaction.guildId},{available: true}]},
          //   required: true
          // }
        }
      }
    }) ;
    const personnages = await Personnage.findAll({
      where: wherePersonnage,
      order: [['serie', 'ASC'],['name', 'ASC'],[{model: Item}, 'rarity', 'ASC']],
      include: [{
        model: Availability,
        as: 'availability',
        where: {[Op.and]: [{guildId: interaction.guildId},{available: true}]},
        required: true
      },
      {
        model: Item,
        required: true,
        // order: [['rarity', 'ASC']],
        include: {
          model: Inventory,
          as: 'inventory',
          where: {[Op.and]: [{guildId: interaction.guildId},{ownerId: interaction.member.id}]},
          required: true
        }
      }]
    });
    // console.log(inventory);
    // return await interaction.editReply('DEBUG');
    console.log(inventory.length);
    // console.log(personnages);
    const numPage = Math.ceil (inventory / maxPerPage) || 1 ;
    const embedInventory = {
      color: 0xDDA624,
      title: `📜 Inventaire de ${interaction.member.displayName} ${serie === 'event' ? iconEvent : ''}`
    } ;
    if (! inventory) {
      embedInventory.description = "Inventaire vide" ;
      embedInventory.footer = {text: `1/1`};
      await interaction.editReply({embeds: [embedInventory]});
    } else {
      // console.log (JSON.stringify(inventory[0], null, 2));
      const allPages = getFields (personnages, maxPerPage, interaction.client) ;
      /////-- DEBUG ALL PAGES     --/////
      // fs.writeFile('inventory.log', JSON.stringify(personnages, null, 2), null, console.log) ;
      /////-- END DEBUG ALL PAGES --/////
      // console.log (allPages[0]);
      var currentPage = 0 ;
      embedInventory.footer = {text: `${currentPage+1}/${allPages.length}`};
      embedInventory.fields = allPages[currentPage];
      const next = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next page')
        .setStyle(ButtonStyle.Success);

      const previous = new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('Previous page')
        .setStyle(ButtonStyle.Success);

        // const end = new ButtonBuilder()
        //   .setCustomId('end')
        //   .setLabel('Close ❌')
        //   .setStyle(ButtonStyle.Secondary);
      
      const actionRow = new ActionRowBuilder()
        .addComponents(previous, next)
        ;
      const response = await interaction.editReply({embeds: [embedInventory], components: [actionRow]});
      const collectorFilter = i => i.user.id === interaction.user.id;
      const collector = response.createMessageComponentCollector({collectorFilter, idle: 60_000, componentType: ComponentType.Button });
      collector.on('collect', buttonInteraction => {
        const action = buttonInteraction.customId ;
        if (action === 'next') {
          currentPage = currentPage == allPages.length-1 ? 0 : currentPage+1 ;
        } else if (action === 'previous') {
          currentPage = currentPage === 0 ? allPages.length-1 : currentPage-1 ;
        } else if (action === 'end') {
          return collector.stop();
        }
        // console.log (`Collected action ${action}`) ;
        embedInventory.footer = {text: `${currentPage+1}/${allPages.length}`};
        embedInventory.fields = allPages[currentPage];
        buttonInteraction.update({embeds: [embedInventory], components: [actionRow]}) ;
      });
      collector.on('end', async collected => {
        await interaction.editReply({embeds: [embedInventory], components: []});
        // console.log ('COLECTION ENDED');
      });
    }
  }
} 