const { SlashCommandBuilder, codeBlock } = require('discord.js');
const {Personnage, Item} = require('../../dbObjects.js');
const { Op } = require("sequelize");

const data = new SlashCommandBuilder()
    .setName('find')
    // .setNameLocalizations({
    //   fr: 'trouve',
    // })
    .setDescription('Find a character or an item')
    // .setDescriptionLocalizations({
    //   fr: 'Trouve un personnage ou un objet',
    // })
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Select if you want to find a character or an item')
        // .setDescriptionLocalizations({
        //   fr: 'Sélectionnez si vous désirez trouvez un personnage (character) ou un objet (item)',
        // })
        .setRequired(true)
        .addChoices(
          { name: 'Character', value: 'character' },
          { name: 'Item', value: 'item' },
        )
    )
    .addStringOption(option =>
      option.setName('keyword')
        // .setNameLocalizations({
        //   fr: 'mot-clé',
        // })
        .setDescription('The keyword for the search')
        // .setDescriptionLocalizations({
        //   fr: 'Le mot-clé pour la recherche',
        // })
        .setRequired(true)
    )
    .setDMPermission(false)
    ;


module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const type = interaction.options.getString('type') ;
    const keyword = interaction.options.getString('keyword') ;
    // console.log (keyword)
    if (type === "character") {
      const personnages = await Personnage.findAll({where: {name: {[Op.iLike]: `%${keyword}%`}}});
      // const personnages = await Personnage.findAll();
      if (personnages === null) {
        await interaction.editReply(`No character found for \`${keyword}\``);
      } else {
        // console.log (personnages[0].name);
        const messageContent = codeBlock ("asciidoc", 
        `= Search Character Result =\n${personnages.map(personnage => `* [${interaction.client.getRarityCharacter (personnage.rarity)}] ${personnage.name}#${personnage.id}\n`).join('')}`
        );
        await interaction.editReply(messageContent);
      }
    } else if (type === "item") {
      const items = await Item.findAll({where: {name: {[Op.iLike]: `%${keyword}%`}}, include: Personnage});
      // const items = await Personnage.findAll();
      if (items === null) {
        await interaction.editReply(`No item found for \`${keyword}\``);
      } else {
        // console.log (items[0]);
        const messageContent = codeBlock ("asciidoc", 
        `= Search Item Result =\n${items.map(item => `* [${interaction.client.getRarityItem(item.rarity)}] ${item.name}#${item.id} from ${item.personnage.name}#${item.personnage.id}\n`).join('')}`
        );
        await interaction.editReply(messageContent);
      }
    } else {
      const messageContent = codeBlock ("asciidoc", 
      `= Invalid type =\n"${type}" is not valid (character or item)`
      );
      await interaction.editReply(messageContent);
    }
  }
}