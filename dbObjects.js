const Sequelize = require('sequelize');
const config = require('./config.json');

// Initialize connections
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'postgresql',
  logging: false,
});

const Personnage = require('./models/Personnage.js')(sequelize, Sequelize.DataTypes);
const Item = require('./models/Item.js')(sequelize, Sequelize.DataTypes);
const Inventory = require('./models/Inventory.js')(sequelize, Sequelize.DataTypes);
const Availability = require('./models/Availability.js')(sequelize, Sequelize.DataTypes);

// UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });
/*
Reflect.defineProperty(Personnage.prototype, '', {
	value: async item => {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.amount += 1;
			return userItem.save();
		}

		return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
	},
});
*/
/*
Reflect.defineProperty(Personnage.prototype, 'getItems', {
	value: () => {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});
*/
module.exports = { Personnage, Item, Inventory, Availability };
