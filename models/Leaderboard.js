module.exports = (sequelize, DataTypes) => {
	return sequelize.define('leaderboard', {
    ownerId: {
      type: DataTypes.BIGINT,
      unique: 'compositeIndex'
    },
    guildId: {
      type: DataTypes.BIGINT,
      unique: 'compositeIndex'
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    items: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: false,
  });
};