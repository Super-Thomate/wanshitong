const Sequelize = require('sequelize');
const config = require('./config.json');
const csv = require('csv-parser');
const fs = require('node:fs') ;

// Initialize connections
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'postgresql',
  logging: false,
});

const Configuration = require('./models/Configuration.js')(sequelize, Sequelize.DataTypes);
const datas = [
  {
    guildId: '283243816448819200',
    occuranceDrop: 10,
    claimTime: 30000,
    characterRate: {"high":"45","regular":"35","low":"20","event":"0"},
    itemRate: {"common":50,"uncommon":30,"rare":15,"epic":5},
    commandClaim : [
      "Legion of Doom",
      "Pierre de Lune",
      "Candy Kingdom",
      "Dandinou",
      "Glyphe",
      "Crystal gems",
      "Lindworm",
      "Loutre avec un coté sombre",
      "Sbire",
      "Renard Cerf",
      "Retour vers le passé",
      "Trolberg",
      "Mutants",
      "Clover Burrow",
      "Avatar",
      "Ukulélé",
      "Hey Adora",
      "Xadia",
      "Gemme",
      "Bouclier",
      "High score",
      "Dust",
      "Grimm",
      "Amitié",
      "Pancake",
      "Chevautruche",
      "Beacon Academy",
      "Princesse du pouvoir",
      "Poney",
      "Animonstre",
      "Boufbowl",
      "Les quatre elements",
      "Are you my mummy ?",
      "Sois le feu et la terre",
      "Moutarde",
      "La femme rouge",
      "Mystery Shack",
      "Crane ancestral",
      "Palisman",
      "Osville",
      "Mewni",
      "Licorne",
      "Dragon",
      "Beach City",
      "FFFC",
      "Cartoon",
      "XANA",
      "Fusion",
      "Enfant du soleil",
      "warriors"
    ]
  },
  {
    guildId: '415598765873954836',
    occuranceDrop: 8,
    claimTime: 30000,
    characterRate: {"high":"45","regular":"40","low":"15","event":"0"},
    itemRate: {"common":50,"uncommon":30,"rare":15,"epic":5},
    commandClaim : [
      "feu",
      "flameo",
      "eau",
      "chalumeau",
      "terre",
      "air",
      "esprit",
      "Yipyip",
      "The au jasmin",
      "fire ferrets",
      "boomerang",
      "Raava",
      "Vaatu",
      "Do the thing",
      "Il n'y a pas de guerre a Ba Sing Se",
      "jeton",
      "Lotus Blanc",
      "Equilibre",
      "Lotus Rouge",
      "Mon nom est Joo Dee",
      "honneur",
      "L'Eau La Terre Le Feu L'Air",
      "Ma grand-mère me racontait souvent des histoires des temps anciens",
      "Mais tout a changé lorsque la Nation du Feu voulut prendre le pouvoir",
      "Mais lorsque le monde eut besoin de lui",
      " il disparut",
      "Cent ans ont passé et la Nation du Feu domine presque le monde aujourd'hui",
      "Mais je n'ai pas perdu espoir"
    ]
  },
] ;
sequelize.sync({ force: false }).then(async () => {
  for (const data of datas) {
    // const data = datas [key];
    // personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
    const [configuration, createdConfiguration] = await Configuration.upsert({
      guildId: data.guildId,
      occuranceDrop: data.occuranceDrop,
      claimTime: data.claimTime,
      characterRate: data.characterRate,
      itemRate: data.itemRate,
      commandClaim: data.commandClaim,
    }) ;
  }

  // await Promise.all(personnages);
  // await Promise.all(items);
  console.log('Database synced');

  // sequelize.close();
}).catch(console.error);