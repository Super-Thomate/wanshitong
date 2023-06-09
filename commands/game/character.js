const { SlashCommandBuilder } = require('discord.js');
const {Personnage, Item, Availability, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('character')
    .setDescription('Show information about a character or load/unload it')
    .addSubcommand(subcommand => 
      subcommand
        .setName('show')
        .setDescription('Show informations for a character')
        .addIntegerOption(option => 
          option
            .setName('id')
            .setDescription('Character id')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('load')
        .setDescription('Load a character')
        .addIntegerOption(option => 
          option
            .setName('id')
            .setDescription('Character id')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('unload')
        .setDescription('Unload a character')
        .addIntegerOption(option => 
          option
            .setName('id')
            .setDescription('Character id')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .setDMPermission(false)
    ;

module.exports = {
  category: 'game',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const id = interaction.options.getInteger('id') ;
    const action = interaction.options.getSubcommand();
    const personnage = await Personnage.findOne({
      where: {id: id},
      include: [
        {model: Item},
        {
          model: Availability,
          as: 'availability',
          where: {guildId: interaction.guildId},
          required: false
        }
      ]
    }) ;
    if (! personnage) {
      return await interaction.editReply(`No character found with id ${id}.`);
    }
    console.log (JSON.stringify(personnage, null, 2));
    if (action === 'show') {
      const available = personnage.availability.length && personnage.availability[0].available ;
      const characterEmbed = {
        color: 0xDDA624,
        title: `${personnage.name} [${interaction.client.getRarityCharacter(personnage.rarity)}] ${available ? '✅' : '❌'}`,
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
    } else if (action === 'load' || action === 'unload') {
      const available = action === 'load' ; 
      const [availability, created] = await Availability.upsert({
        guildId: interaction.guildId,
        available: available,
        personnageId: personnage.id
      });
      await availability.save() ;
      await interaction.editReply(`${personnage.name} ${available?'':'un'}loaded.`);
      // redo leaderboard
      const leaderboard = await Leaderboard.findAll({
        where: {guildId: interaction.guildId},
        order: [['items', 'DESC']]
      });
      for (const row of leaderboard) {
        const trueNumberOfItems = await getInventoryCount(interaction.guildId, row.ownerId) ;
        if(trueNumberOfItems !== row.items) {
        //   console.log ('Difference !') ;
        //   console.log (`Get ${row.items}, awaiting ${trueNumberOfItems}`) ;
          await Leaderboard.update({items: trueNumberOfItems}, {
            where: {[Op.and]: [{ownerId: row.ownerId}, {guildId: interaction.guildId}]}
          });
        }
      }
    } else {
      await interaction.editReply(`${action} not supported.`);
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
        where: {rarity: {[Op.not]: 4}},
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