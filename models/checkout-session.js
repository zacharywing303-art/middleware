'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckoutSession = sequelize.define('CheckoutSession', {
    id: {                      // 1:1 with sessions.id
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    success_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancel_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'checkout_sessions',
    timestamps: true, // base Session already has createdAt/updatedAt
  });

  CheckoutSession.associate = (models) => {
    CheckoutSession.belongsTo(models.Session, {
      as: 'base',
      foreignKey: 'id',
      onDelete: 'CASCADE',
    });
  };

  return CheckoutSession;
};