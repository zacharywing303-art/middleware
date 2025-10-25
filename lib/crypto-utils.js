const crypto = require('crypto');
const argon2 = require('argon2');

function generateKey() {
    const base62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(48);
    let key = '';
    for (let i = 0; i < bytes.length; i++) {
      key += base62[bytes[i] % base62.length];
    }
    return `sk-${key}`;
}

function generateApiKey() {
    const key_id = crypto.randomBytes(8).toString('hex');
    const secret = generateKey();
    return { key_id, secret };
}

async function hashSecret(secret) {
    // argon2id recommended
    return argon2.hash(secret, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }
  
async function verifySecret(secret_hash, candidate) {
  return argon2.verify(secret_hash, candidate);
}

module.exports = {
    generateApiKey,
    hashSecret,
    verifySecret
}