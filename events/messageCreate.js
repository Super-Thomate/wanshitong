const { Events } = require('discord.js');
const { Op } = require('sequelize') ;
const { Configuration, Blacklist } = require('../dbObjects.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // console.log(message);
    if (message.author.bot) return; // do not listen to bots
    
    const [configuration, created] = await Configuration.findOrCreate({
      where: {guildId: message.guildId}
    });
    const botMention = new RegExp(`<@!?${message.client.user.id}>`); // To check if WST is mentionned
    if (
      configuration.question && (! await message.client.isBlackList(message.author.id, message.guildId, 'magic_8_ball')) && (message.content.match(botMention) !== null)
      && message.content.endsWith('?')
    ) {
      // console.log ('Magic 8 ball') ;
      const answer = [ "Essaye plus tard",
                     "Essaye encore",
                     "Pas d'avis",
                     "C'est ton destin",
                     "Le sort en est jeté",
                     "Une chance sur deux",
                     "Repose ta question",
                     "D'après moi oui",
                     "C'est certain",
                     "Oui absolument",
                     "Tu peux compter dessus",
                     "Sans aucun doute",
                     "Très probable",
                     "Oui",
                     "C'est bien parti",
                     "C'est non",
                     "Peu probable",
                     "Faut pas rêver",
                     "N'y compte pas",
                     "Impossible"
                   ] ;
      message.reply ({content: answer.random()+"."}) ;
    }

    // CHARACTER DROP
    if (message.interaction === null && !message.content.startsWith('-')) { // just in case check this is a genuine message
      const drop = Math.floor(Math.random() * 100) + 1;
      const canDrop = (typeof message.client.alreadyDropped === 'undefined' || typeof message.client.alreadyDropped [message.guild.id] === "undefined" || message.client.alreadyDropped [message.guild.id] === null) ;
      console.log (`Can drop: ${canDrop}`);
      if (drop <= configuration.occuranceDrop && canDrop) {
        if (typeof message.client.alreadyDropped === 'undefined') {
          message.client.alreadyDropped = {} ;
        }
        message.client.alreadyDropped [message.guildId] = Date.now() ; // We don't want to drop while a character is waiting
        // console.log ("Drop the charater") ;
        try {
          const dropChannel = await message.guild.channels.cache.find(c => c.id === configuration.dropChannel) ;
          if (typeof(dropChannel) === 'undefined' || dropChannel === null) {
            throw new Error ('No channel set for character drop.') ;
          }
          try {
           await message.client.dropCharacter (dropChannel) ;
          } catch (dropErr) {
            await dropChannel.send({content: dropErr.message}) ;
            console.error (`DROP ERROR: ${dropErr}`) ;
            message.client.alreadyDropped [message.guildId] = null ; // Clear
          }
        } catch (err) {
          console.error(err) ;
          message.client.alreadyDropped [message.guildId] = null ; // Clear
        }
      }
    }
  },
};
