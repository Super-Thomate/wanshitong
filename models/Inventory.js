module.exports = (sequelize, DataTypes) => {
	return sequelize.define('inventory', {
    ownerId: {
      type: DataTypes.BIGINT,
      unique: 'compositeIndex'
    },
    itemId: {
      type: DataTypes.INTEGER,
      unique: 'compositeIndex'
    },
    guildId: {
      type: DataTypes.BIGINT,
      unique: 'compositeIndex'
    }
  }, {
    timestamps: false,
  });
};