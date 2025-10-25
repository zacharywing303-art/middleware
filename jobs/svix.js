// lib/svix.js
'use strict';

const { getJwt } = require('./svix-utils');

const axios = require('axios').create({
  baseURL: process.env.SVIX_BASE_URL || 'http://localhost:8071',
  timeout: 10_000,
  validateStatus: () => true,
});

function svixHeaders() {
  return { Authorization: `Bearer ${getJwt()}` };
}

/**
 * Send a message to a Svix app.
 *  - appId: Svix App ID (string you stored per merchant)
 *  - eventType: e.g. "payment.updated" (your taxonomy)
 *  - payload: JSON payload (will be signed by Svix to the merchant endpoint)
 *  - idemKey: for dedupe on Svix side (use outbox id)
 */
async function sendMessage({ appId, eventType, payload, idemKey }) {
  const res = await axios.post(
    `/api/v1/app/${encodeURIComponent(appId)}/msg/`,
    {
      eventType: eventType,
      payload,
    },
    {
      headers: {
        ...svixHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey, // Svix dedup for safety
      },
    }
  );
  return res;
}

module.exports = { sendMessage };