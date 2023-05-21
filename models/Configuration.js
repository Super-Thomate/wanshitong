module.exports = (sequelize, DataTypes) => {
	return sequelize.define('configuration', {
    guild_id: {
      type: DataTypes.BIGINT,
      primareyKey: true
    },
    question: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    occuranceDrop: {
      type: DataTypes.REAL,
      defaultValue: 10.0
    },
    roleComplete: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    dropChannel: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    claimTime: {
      type: DataTypes.INTEGER,
      defaultValue: 10000
    },
    characterRate: {
      type: DataTypes.JSONB,
      defaultValue: {"high":25.0, "regular":25.0, "low":25.0, "event":25.0}
    },
    itemRate: {
      type: DataTypes.JSONB,
      defaultValue: {"common":25.0, "uncommon":25.0, "rare":25.0, "epic":25.0}
    },
    commandClaim: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ["foo", "bar"]
    },
  }, {
    timestamps: false,
  });
};