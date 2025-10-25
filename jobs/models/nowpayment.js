'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class NowpaymentPayment extends Model {
    static associate(models) {
      // Optional: link back to your User/Product/Order if you want
      NowpaymentPayment.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  NowpaymentPayment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Which user initiated this (optional)
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // From your payload
      price_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      price_currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      success_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cancel_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ipn_callback_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_fixed_rate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_fee_paid_by_user: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      // Fields returned from NOWPayments API
      provider_payment_id: {
        type: DataTypes.STRING,
        allowNull: true, // set when API responds
      },
      invoice_url: {
        type: DataTypes.STRING,
        allowNull: true, // from NOWPayments response
      },

      // Tracking status
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'created', // created/sent/paid/failed/etc.
      },

      raw_response: {
        type: DataTypes.JSONB,
        allowNull: true, // store NOWPayments API response
      },
    },
    {
      sequelize,
      modelName: 'NowpaymentPayment',
      tableName: 'nowpayment_payments',
      timestamps: true, // adds createdAt, updatedAt
      indexes: [
        { fields: ['order_id'], unique: true },
        { fields: ['provider_payment_id'] },
      ],
    }
  );

  return NowpaymentPayment;
};