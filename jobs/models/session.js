// models/session.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Session extends Model {
    static associate(models) {
      Session.belongsTo(models.User,   { foreignKey: 'userId' });     // nullable
      Session.hasOne(models.CheckoutSession, { foreignKey: 'sessionId' });
      Session.hasOne(models.SubscriptionSession, { foreignKey: 'sessionId' });
    }
  }

  Session.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Who/what created this session (pick one or keep both optional)
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // Security: single-use + expiry
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Optional: anti-replay / verification helpers
      nonce: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, // if you want to enforce uniqueness
      },

      token_hash: {
        // store a hash of a JWT/jti or signed blob (never store raw token)
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },

      // Audit
      ip_created: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ua_created: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Free-form metadata (keep lightweight)
      meta: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      // Lifecycle
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active', // active | expired | consumed | revoked
      },
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'sessions',
      timestamps: true, // createdAt, updatedAt
      indexes: [
        { fields: ['userId'] },
        { fields: ['expires_at'] },
        { fields: ['used'] },
        { unique: true, fields: ['token_hash'] },
        { unique: true, fields: ['nonce'] },
        // handy compound for sweeping:
        { fields: ['status', 'expires_at'] },
      ],
    }
  );

  return Session;
};