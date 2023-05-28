const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // client.application.commands.permissions.fetch({ guild: '494812563016777729' })
    //   .then(perms => {
    //     console.log(`Fetched permissions for ${perms.size} commands`);103907580723617792
    //     perms.forEach((perm, id, perms) => {
    //       console.log (id)
    //     });
    //   })
    //   .catch(console.error);
  }
}