const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {Configuration, Personnage, Item, Availability, Inventory, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");


const data = new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give characters or items to a member')
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')  
        .setDescription('Give all items to a member')
        .addUserOption(option => option.setName('member').setDescription('Not required').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('character')  
        .setDescription('Give all items of a character to a member')
        .addNumberOption(option => option.setName('characterid').setDescription('Character id').setMinValue(1).setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Not required').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('item')  
        .setDescription('Give one item to a member')
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
    const configuration = await Configuration.findOne({where: {guildId: guildId}}) ;
    const member = interaction.options.getUser('member') || interaction.member ;
    const ownerId = member.id ;
    if (action === 'all') {
      const items = await Item.findAll({
        include: {
          model: Personnage, 
          where: {rarity: {[Op.not]: 4}}, // event excluded
          required: true, 
          include: {
            model: Availability, 
            as: 'availability',
             required: true, 
             where: {[Op.and]: [{guildId: guildId}, {available: true}]}
          }
        }
      }) ;
      for (const item of items) {
        // console.log(JSON.stringify(item, null, 2));
        const inventory = await Inventory.findOne({
          where: {
            [Op.and]: [{ownerId: ownerId}, {guildId: guildId}, {itemId: item.id}]
          }
        }) ;
        const created = inventory === null ;
        if (created) {
          // insert into inventory
          // console.log (item.id);
          Inventory.create(
            {
              ownerId: ownerId,
              guildId: guildId,
              itemId: item.id
            }
          ) ;
        }
      }
      // update leaderbord
      const [leaderboard, createdLeaderboard] = await Leaderboard.findOrCreate({
        where: {[Op.and]: [{ownerId: ownerId}, {guildId: guildId}]},
        defaults: {
          ownerId: ownerId,
          guildId: guildId
        }
      }) ;
      await leaderboard.update({
        items: items.length,
        completed: true
      }) ;
      const roleComplete = configuration.roleComplete ;
      if (roleComplete !== null) {
        const role = await interaction.guild.roles.cache.find (r => r.id === roleComplete) ;
        await interaction.editReply(`Félicitations **${member}** ! Ta persévérance dans la quête des nombreux artéfacts t'octroie le privilège d'intégrer les rangs de mes serviles ${role}.`) ;
      } else {
        await interaction.editReply(`Félicitations **${member}** !`) ;
      }
      // console.log (items.length) ;
      // await interaction.editReply(`All available items added to ${member}.`);
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
        const inventory = await Inventory.findOne({
          where: {
            [Op.and]: [{ownerId: ownerId}, {guildId: guildId}, {itemId: item.id}]
          }
        }) ;
        const created = inventory === null ;
        if (created) {
          // insert into inventory
          // console.log (item.id);
          await Inventory.create(
            {
              ownerId: ownerId,
              guildId: guildId,
              itemId: item.id
            }
          ) ;
        }
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
      await interaction.editReply(`All items of ${personnage.name} given to ${member}.`);
    } else
    if (action === 'item') {
      const itemid = interaction.options.getNumber('itemid');
      const item = await Item.findOne({
        where: {id: itemid}
      }) ;
      if (item === null) {
        return await interaction.editReply(`No item for id ${itemid}`) ;
      }
      const inventory = await Inventory.findOne({
        where: {
          [Op.and]: [{ownerId: ownerId}, {guildId: guildId}, {itemId: itemid}]
        }
      }) ;
      const created = inventory === null ;
      if (created) {
        // insert into inventory
        // console.log (item.id);
        await Inventory.create(
          {
            ownerId: ownerId,
            guildId: guildId,
            itemId: itemid
          }
        ) ;
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
      await interaction.editReply(`Item ${item.name} given to ${member}.`);
    } else {
      await interaction.editReply(`${action} not supported.`);
    }
  }
}