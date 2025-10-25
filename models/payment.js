'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.User, { foreignKey: 'user_id' });
      Payment.belongsTo(models.Provider, { foreignKey: 'provider_id' });
      Payment.belongsTo(models.Session, {foreignKey: 'session_id'} );
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      provider_payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      provider_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING, // pending, completed, failed, cancelled, refunded
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      raw_response: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['provider_id'],
        },
        {
          fields: ['session_id'],
        },
        {
          fields: ['provider_payment_id'],
        },
      ],
    }
  );

  return Payment;
};