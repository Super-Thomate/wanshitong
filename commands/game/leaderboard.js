const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const {Personnage, Item, Availability, Inventory, Leaderboard} = require('../../dbObjects.js');
const { Op } = require("sequelize");
const fs = require('node:fs') ;


const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Display the leaderboard')
    .setDMPermission(false)
    ;

const emojiCompleted = '🦊️' ;

const getFields = async (leaderboard, max, guild) => {
  const allFields = [] ;
  let currentPage = 0 ;
  let currentRow = 0 ;
  const allItems = await Item.count({
    include: {
      model: Personnage,
      where: {rarity: {[Op.not]: 4}}, // event excluded
      required: true,
      include: {
        model: Availability,
        where: {[Op.and]: [{guildId: guild.id}, {available: true}]},
        as: 'availability',
        required: true
      }
    }
  }) ;
  for (const row of leaderboard) {
    if (allFields[currentPage] === null || !Array.isArray(allFields[currentPage])) {
      allFields[currentPage] = [] ;
    }
    const guildMember = await guild.members.cache.find(u => u.id == row.ownerId) ;
    allFields[currentPage].push({name: `${currentPage*max+currentRow+1}. ${row.completed ? emojiCompleted : '' } ${guildMember ? guildMember.displayName : 'NONAME'} (${guildMember ? guildMember.user.username : ''})`, value: `Items : ${row.items}/${allItems}`}) ;
    currentRow++ ;
    if (currentRow == max) {
      currentRow = 0 ;
      currentPage++;
    }
  }
  return allFields ;
}

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const maxPerPage = 10 ;
    const leaderboard = await Leaderboard.findAll({
      where: {guildId: interaction.guildId},
      order: [['items', 'DESC']]
    });
    // console.log(leaderboard) ;
    const embedLeaderboard = {
      color: 0xDDA624,
      title: `Leaderboard de ${interaction.guild.name}`
    } ;
    const allPages = await getFields(leaderboard, maxPerPage, interaction.guild) ;
    var currentPage = 0 ;
    embedLeaderboard.footer = {text: `${currentPage+1}/${allPages.length}`};
    embedLeaderboard.fields = allPages[currentPage];
    const next = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next page')
      .setStyle(ButtonStyle.Success);

    const previous = new ButtonBuilder()
      .setCustomId('previous')
      .setLabel('Previous page')
      .setStyle(ButtonStyle.Success);

      const end = new ButtonBuilder()
        .setCustomId('end')
        .setLabel('Close ❌')
        .setStyle(ButtonStyle.Secondary);
    
    const actionRow = new ActionRowBuilder()
      .addComponents(previous, next, end)
      ;
    const response = await interaction.editReply({embeds: [embedLeaderboard], components: [actionRow]});
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
      embedLeaderboard.footer = {text: `${currentPage+1}/${allPages.length}`};
      embedLeaderboard.fields = allPages[currentPage];
      buttonInteraction.update({embeds: [embedLeaderboard], components: [actionRow]}) ;
    });
    collector.on('end', async collected => {
      await interaction.editReply({embeds: [embedLeaderboard], components: []});
      // console.log ('COLECTION ENDED');
    });
  }
} 