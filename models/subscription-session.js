'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionSession = sequelize.define('SubscriptionSession', {
    id: {                      // 1:1 with sessions.id
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    success_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancel_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'subscription_sessions',
    timestamps: true
  });

  SubscriptionSession.associate = (models) => {
    SubscriptionSession.belongsTo(models.Session, {
      as: 'base',
      foreignKey: 'id',
      onDelete: 'CASCADE',
    });
  };

  return SubscriptionSession;
};