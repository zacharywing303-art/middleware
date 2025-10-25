// models/delivery.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Delivery extends Model {
    static associate(models) {
      // Each delivery attempt is for one NOWPayments webhook event
      Delivery.belongsTo(models.NowpaymentWh, {
        foreignKey: 'nowpaymentWhId',
        as: 'event',
      });
      // And for one client/tenant account
      Delivery.belongsTo(models.User, {
        foreignKey: 'userId',
      });
    }
  }

  Delivery.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      // FK -> nowpayment_wh(id)
      nowpaymentWhId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      // FK -> accounts(id)  (TEXT in your schema)
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      // HTTP status code from client callback (nullable if network error)
      status_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // Time spent for the attempt (ms)
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // When this attempt happened
      attempted_at: {
        type: DataTypes.DATE, // TIMESTAMPTZ
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      // Whether the attempt succeeded (2xx)
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },

      // Optional: error message if failed (network/5xx/etc.)
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Delivery',
      tableName: 'deliveries',
      timestamps: false, // attempted_at already records time; flip to true if you prefer createdAt/updatedAt
      indexes: [
        { fields: ['nowpaymentWhId'] },
        { fields: ['userId'] },
        { fields: ['attempted_at'] },
      ],
    }
  );

  return Delivery;
};