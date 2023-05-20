module.exports = (sequelize, DataTypes) => {
	return sequelize.define('item', {
    id:{
      type: DataTypes.INTEGER,
      // unique: true,
      autoIncrement: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    rarity: DataTypes.INTEGER,
    character_id: DataTypes.INTEGER
  }, {
    timestamps: false,
  });
};