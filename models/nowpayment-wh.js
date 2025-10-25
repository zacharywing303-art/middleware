'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class NowpaymentWh extends Model {
    static associate(models) {
      NowpaymentWh.belongsTo(models.Payment, { foreignKey: 'paymentId' });
    }
  }

  NowpaymentWh.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Optional FK if you want to attach to your Payment
      payment_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // NOWPayments order_id (you usually set this yourself)
      order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // NOWPayments status (raw, like waiting/confirming/confirmed/finished/failed/refunded)
      payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Fiat price you set (e.g. 12 USD)
      price_amount: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      price_currency: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Crypto side (user pays this)
      pay_amount: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      pay_currency: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // What user actually paid
      actually_paid: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },

      // Wallet address
      pay_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Timestamps from NOWPayments
      created_at_provider: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updated_at_provider: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Full payload for audit/debug
      raw: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'NowpaymentWh',
      tableName: 'nowpayment_wh',
      timestamps: true, // createdAt, updatedAt
      indexes: [
        {
          fields: ['payment_id'], // idempotency: one row per NOWPayments payment_id
        },
      ],
    }
  );

  return NowpaymentWh;
};