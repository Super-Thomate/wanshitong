# Wan Shi Tong
Discord bot for collecting items

## Installation

Execute `node dbInit.js` to initialize the database and populate it with predefined characters (courtesy of Realms of Fantasy).

## Help
Use `/help` to view all commands, and `/help <command>` to view every subcommand an options for `<command>`.

## Permissions
Permissions to use a slash command are handled in Settings > Integrations > Wan Shi Tong (or the bot's name you used when you hosted it).
There you can allow or deny the usages in specific channels, for specific roles or users, of specific commands or all of them.

It is recommended to allow only the usage of `/inventory`, `/leaderboard` and `/help` for players.

## Game master
You can (and must) configure the bot by using `/configuration` (every action is describe in the command data).

After having set a channel (using `/configuration dropchannel`) and an chance to spawn (using `/configuration occurancedrop`), you need to load characters to allow them to spawn. You can do so by using `/game load` to load all characters from a `serie` or `character load` to load a specific character.

## Players
### Gameplay
Whenever a message is posted in a channel where the bot can listen, there is a chance (defined by `/configuration occurancedrop`) to spawn a character in a channel (defined by `/configuration dropchannel`). The first user to give the correct phrase (defined by `/configuration commandclaim`) is rewarded with an item for the character.

When a user has collected all the items, they are awarded a special role (defined by `/configuration rolecomplete`) and a fox emoji is added on the leaderboard.

### Inventory
Users have an inventory where all their items are, and then can display it whith `/inventory`. This command will display all items from characters that are available on the guild, and are not event characters.

To display the inventory for a specific serie, use the command `/inventory <serie>` and to view the inventory of event characters, use `/inventory event`.

### Leaderboard
A leaderboard is available with the command `/leaderboard`. Every users that have acquired an item are in the leaderboard.