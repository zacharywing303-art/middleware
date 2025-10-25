// models/changellyWh.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ChangellyWh extends Model {
    static associate(models) {
      // Optional: link to your internal Payment/Account if you want
      // ChangellyWh.belongsTo(models.Payment, { foreignKey: 'paymentId' });
      // ChangellyWh.belongsTo(models.Account, { foreignKey: 'accountId' });
    }
  }

  ChangellyWh.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Core identifiers
      order_id: {
        // "orderId": "29cc3cb1-531a-46b3-be5c-1204ea49445a"
        type: DataTypes.STRING,
        allowNull: false,
      },
      external_user_id: {
        // "externalUserId": "user-fZgbm9A9iM5q"
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_order_id: {
        // "externalOrderId": "1vPz7cAv7TtD"
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_code: {
        // "providerCode": "banxa"
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Status/type
      status: {
        // "expired" | "pending" | "completed" | "failed" | ...
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        // "buy" | "sell" | ...
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Amounts & currencies
      payin_amount: {
        // "payinAmount": "620"
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      payout_amount: {
        // "payoutAmount": null
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      payin_currency: {
        // "payinCurrency": "USD"
        type: DataTypes.STRING,
        allowNull: true,
      },
      payout_currency: {
        // "payoutCurrency": "BTC"
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Redundant aliases (some payloads also send currencyFrom/currencyTo/amountFrom)
      currency_from: {
        // "currencyFrom": "USD"
        type: DataTypes.STRING,
        allowNull: true,
      },
      currency_to: {
        // "currencyTo": "BTC"
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount_from: {
        // "amountFrom": "620"
        type: DataTypes.DECIMAL,
        allowNull: true,
      },

      // Geo / KYC-ish fields
      country: {
        // "US"
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      state: {
        // "CA"
        type: DataTypes.STRING,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Wallet & refunds
      wallet_address: {
        // "walletAddress": "bc1q..."
        type: DataTypes.STRING,
        allowNull: true,
      },
      wallet_extra_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refund_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Payment / client info
      payment_method: {
        // "card"
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Links / metadata
      redirect_url: {
        // long URLs; use TEXT
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Provider timestamps (keep separate from Sequelize's createdAt/updatedAt)
      provider_created_at: {
        // from payload "createdAt"
        type: DataTypes.DATE,
        allowNull: true,
      },
      provider_updated_at: {
        // from payload "updatedAt"
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Full raw payload for audit/debug
      raw: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'ChangellyWh',
      tableName: 'changelly_wh',
      timestamps: true, // adds createdAt, updatedAt (DB receipt times)
      indexes: [
        { unique: true, fields: ['order_id'] }, // idempotency
        { fields: ['status'] },
        { fields: ['external_user_id'] },
        { fields: ['provider_code'] },
      ],
    }
  );

  return ChangellyWh;
};