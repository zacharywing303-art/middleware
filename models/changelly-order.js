// models/changellyOrder.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ChangellyOrder extends Model {
    static associate(models) {
      // Optional associations if you want:
      ChangellyOrder.belongsTo(models.User, { foreignKey: 'userId' });
      // ChangellyOrder.belongsTo(models.Account, { foreignKey: 'accountId' });
    }
  }

  ChangellyOrder.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Optional FK(s) on your side
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // Identifiers from Changelly
      order_id: {
        // "orderId": "e2f85c45-68b2-4179-b1de-0aad06f826a2"
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      external_user_id: {
        // "externalUserId": "user-..."
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_order_id: {
        // "externalOrderId": "fjPOpwK6nA3k"
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_code: {
        // "providerCode": "banxa"
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Order attributes
      type: {
        // "buy" | "sell"
        type: DataTypes.STRING,
        allowNull: true,
      },
      currency_from: {
        // "USD"
        type: DataTypes.STRING,
        allowNull: true,
      },
      currency_to: {
        // "BTC"
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount_from: {
        // "12" (use DECIMAL to preserve precision)
        type: DataTypes.DECIMAL,
        allowNull: true,
      },

      // Geo / client info
      country: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Wallet + refund
      wallet_address: {
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

      // Payment method
      payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // URLs
      redirect_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      return_failed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      return_success_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Custom metadata you may send/receive
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Provider timestamps
      provider_created_at: {
        // from payload "createdAt"
        type: DataTypes.DATE,
        allowNull: true,
      },
      provider_updated_at: {
        // not always present at creation
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Local tracking/status if you want to update later from webhooks
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'created', // created/pending/completed/failed/expired
      },

      // Keep the whole response for audit/debug
      raw: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'ChangellyOrder',
      tableName: 'changelly_orders',
      timestamps: true, // createdAt, updatedAt (your DB receipt times)
      indexes: [
        { unique: true, fields: ['order_id'] },
        { fields: ['external_user_id'] },
        { fields: ['external_order_id'] },
        { fields: ['provider_code'] },
        { fields: ['status'] },
      ],
    }
  );

  return ChangellyOrder;
};