const { SlashCommandBuilder, codeBlock } = require('discord.js');
const {Personnage, Item, Availability, Inventory, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('game')
    .setDescription('Manage the game')
    .addSubcommand(subcommand =>
      subcommand
        .setName('load')
        .setDescription('Load all characters from a serie')
        .addStringOption(option =>
          option
            .setName('serie')
            .setDescription('The serie to load')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unload')
        .setDescription('Unload all characters from a serie')
        .addStringOption(option =>
          option
            .setName('serie')
            .setDescription('The serie to unload')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('Show all characters from a serie')
        .addStringOption(option =>
          option
            .setName('serie')
            .setDescription('The serie to show')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all characters loaded')
    )
    .setDMPermission(false)
    ;


module.exports = {
  category: 'game',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const action = interaction.options.getSubcommand() ;
    if (action === 'load'|| action === 'unload') {
      const serie = interaction.options.getString('serie').toLowerCase() ;
      const personnages = await Personnage.findAll({
        where: {serie: serie}
      }) ;
      if (! personnages.length) {
        await interaction.editReply(`No characters for serie ${serie}.`);
        return ;
      }
      try {
        const available = action === 'load' ; 
        // console.log (available);
        for (const personnage of personnages) {
            const [availability, created] = await Availability.upsert({
              guildId: interaction.guildId,
              available: available,
              personnageId: personnage.id
            });
            // console.log (JSON.stringify(personnage, null, 2)) ;
            // availability.set({available: available}) ;
            await availability.save() ;
            console.log (`${personnage.name} is ${available?'':'un'}loaded`) ;
            // console.log (JSON.stringify(availability, null, 2)) ;
        }
        await interaction.editReply(`${serie} ${available?'':'un'}loaded.`);
        // recalculer le leaderboard
        const leaderboard = await Leaderboard.findAll({
          where: {guildId: interaction.guildId},
          order: [['items', 'DESC']]
        });
        for (const row of leaderboard) {
          const trueNumberOfItems = await getInventoryCount(interaction.guildId, row.ownerId) ;
          if(trueNumberOfItems !== row.items) {
            console.log ('Difference !') ;
          }
        }
      } catch (err) {
        console.error(err) ;
        await interaction.editReply(`An error occured while trying to load or unload ${serie}.`);
      }
    } else
    if (action === 'show') {
      const serie = interaction.options.getString('serie').toLowerCase() ;
      const personnages = await Personnage.findAll({
        where: {serie: serie},
        include: {
          model: Availability,
          as: 'availability'
        }
      }) ;
      var body = '' ;
      for (const personnage of personnages) {
        // console.log (JSON.stringify(personnage, null, 2)) ;
        const available = (personnage.availability !== null && personnage.availability.length && personnage.availability[0].available) ;
        // console.log(availability) ;
        body +=`* [${interaction.client.getRarityCharacter (personnage.rarity)}] ${personnage.name}#${personnage.id} ${available ? '✅' : '❌'}\n` ;
      }
      const messageContent = codeBlock ("asciidoc", 
      `= Characters in ${serie} =\n${body}`
      );
      await interaction.editReply(messageContent);
    } else
    if (action === 'list') {
      const loaded = await Availability.findAll({
        where: {[Op.and]: [{guildId: interaction.guildId}, {available: true}]},
        include: {
          model: Personnage,
          as: 'personnage'
        }
      }) ;
      // console.log (loaded.length) ;
      var body = '' ;
      for (const available of loaded) {
        // console.log (available.personnage);
        body +=`* [${interaction.client.getRarityCharacter (available.personnage.rarity)}] ${available.personnage.name}#${available.personnage.id}\n` ;
      }
      
      const messageContent = codeBlock ("asciidoc", 
      `= Characters loaded =\n${body.length ? body : 'No characters loaded'}`
      );
      await interaction.editReply(messageContent);
    }
  }
}

const getInventoryCount = async (guildId, ownerId) => {
  return await Inventory.count({
    where: {[Op.and]:[
      {guildId: guildId},
      {ownerId: ownerId}
    ]},
    include: {
      model: Item,
      as: 'item',
      required: true,
      include: {
        model: Personnage,
        required: true,
        where: {[Op.not]: 4},
        include: {
          model: Availability,
          as: 'availability',
          where: {[Op.and]: [{guildId: guildId},{available: true}]},
          required: true
        }
      }
    }
  }) ;
}