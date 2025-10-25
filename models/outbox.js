// models/outbox.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Outbox extends Model {
    static associate(models) {
      // Each outbox job is for a specific NOWPayments webhook row
      Outbox.belongsTo(models.NowpaymentWh, {
        foreignKey: 'nowpaymentWhId',
        as: 'nowpaymentWh',
      });

      Outbox.belongsTo(models.ChangellyWh, {
        foreignKey: 'changellyWhId',
        as: 'changellyWh',
      });

      Outbox.belongsTo(models.WhopWh, {
        foreignKey: 'whopWhId',
        as: 'whopWh',
      });

      // Optional: which client/tenant to deliver to
      Outbox.belongsTo(models.User, {
        foreignKey: 'userId',
      });
    }
  }

  Outbox.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      nowpaymentWhId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      changellyWhId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      whopWhId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // FK -> users(id)
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      next_attempt_at: {
        type: DataTypes.DATE, // TIMESTAMPTZ
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },

      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // pending | sent | failed
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [['pending', 'sent', 'failed']] },
      },

      // optional: last error message for debugging
      last_error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Outbox',
      tableName: 'outbox',
      timestamps: true, // createdAt, updatedAt
      indexes: [
        { fields: ['status', 'next_attempt_at'] }, // efficient polling
        { fields: ['userId'] }
      ],
    }
  );

  return Outbox;
};