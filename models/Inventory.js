module.exports = (sequelize, DataTypes) => {
	return sequelize.define('inventory', {
    owner_id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    guild_id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    }
  }, {
    timestamps: false,
  });
};