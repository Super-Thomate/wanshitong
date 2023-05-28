const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {Personnage, Item, Availability, Inventory, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove characters or items from a member')
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')  
        .setDescription('Remove all items from a member')
        .addUserOption(option => option.setName('member').setDescription('Not required').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('character')  
        .setDescription('Remove all items of a character from a member')
        .addNumberOption(option => option.setName('characterid').setDescription('Character id').setMinValue(1).setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Not required').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('item')  
        .setDescription('Remove one item from a member')
        .addNumberOption(option => option.setName('itemid').setDescription('Item id').setMinValue(1).setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Not required').setRequired(false))
    )
    .setDMPermission(false)
    ;

module.exports = {
  category: 'settings',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const action = interaction.options.getSubcommand();
    const guildId = interaction.guildId ;
    const member = interaction.options.getUser('member') || interaction.member ;
    const ownerId = member.id ;
    if (action === 'all') {
      await Inventory.destroy({
        where: {
          [Op.and]: [{ownerId: ownerId}, {guildId: guildId}]
        }
      }) ;
      // console.log (items.length) ;
      // update leaderbord
      const [leaderboard, createdLeaderboard] = await Leaderboard.findOrCreate({
        where: {[Op.and]: [{ownerId: ownerId}, {guildId: guildId}]},
        defaults: {
          ownerId: ownerId,
          guildId: guildId
        }
      }) ;
      await leaderboard.update({
        items: 0,
        completed: false
      }) ;
      await interaction.editReply(`Removed all items from ${member}.`);
    } else
    if (action === 'character') {
      const characterid = interaction.options.getNumber('characterid');
      const personnage = await Personnage.findOne({
        where: {id: characterid},
        include: {
          model: Item
        }
      }) ;
      if (personnage === null) {
        return await interaction.editReply(`No character for id ${characterid}`) ;
      }
      // console.log (personnage);
      for (const item of personnage.items) {
        await Inventory.destroy({
          where: {
            [Op.and]: [{ownerId: ownerId}, {guildId: guildId}, {itemId: item.id}]
          }
        }) ;
      }
      const inventoryCount = await Inventory.count({
        where: {[Op.and]: [{guildId: guildId},{ownerId: interaction.member.id}]},
        include: {
          model: Item,
          as: 'item',
          required: true,
          include: {
            model: Personnage,
            where: {rarity: {[Op.not]: 4}}, // event excluded
            required: true,
            include: {
              model: Availability,
              as: 'availability',
              where: {[Op.and]: [{guildId: guildId},{available: true}]},
              required: true
            }
          }
        }
      }) ;
      // update leaderbord
      const [leaderboard, createdLeaderboard] = await Leaderboard.findOrCreate({
        where: {[Op.and]: [{ownerId: ownerId}, {guildId: guildId}]},
        defaults: {
          ownerId: ownerId,
          guildId: guildId
        }
      }) ;
      await leaderboard.update({
        items: inventoryCount
      }) ;
      await interaction.editReply(`All items of ${personnage.name} removed from ${member}.`);
    } else
    if (action === 'item') {
      const itemid = interaction.options.getNumber('itemid');
      const item = await Item.findOne({
        where: {id: itemid}
      }) ;
      if (item === null) {
        return await interaction.editReply(`No item for id ${itemid}`) ;
      }
      await Inventory.destroy({
        where: {
          [Op.and]: [{ownerId: ownerId}, {guildId: guildId}, {itemId: itemid}]
        }
      }) ;
      const inventoryCount = await Inventory.count({
        where: {[Op.and]: [{guildId: guildId},{ownerId: interaction.member.id}]},
        include: {
          model: Item,
          as: 'item',
          required: true,
          include: {
            model: Personnage,
            where: {rarity: {[Op.not]: 4}}, // event excluded
            required: true,
            include: {
              model: Availability,
              as: 'availability',
              where: {[Op.and]: [{guildId: guildId},{available: true}]},
              required: true
            }
          }
        }
      }) ;
      // console.log(inventoryCount) ;
      // update leaderbord
      const [leaderboard, createdLeaderboard] = await Leaderboard.findOrCreate({
        where: {[Op.and]: [{ownerId: ownerId}, {guildId: guildId}]},
        defaults: {
          ownerId: ownerId,
          guildId: guildId
        }
      }) ;
      await leaderboard.update({
        items: inventoryCount
      }) ;
      await interaction.editReply(`Item ${item.name} removed from ${member}.`);
    } else {
      await interaction.editReply(`${action} not supported.`);
    }
  }
}