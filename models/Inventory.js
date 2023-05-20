module.exports = (sequelize, DataTypes) => {
	return sequelize.define('inventory', {
    owner_id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    itemId: {
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