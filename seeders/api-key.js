const { generateApiKey, hashSecret } = require('../lib/crypto-utils');
const { ApiKey } = require('../models');

async function seedApiKey() {   
    try {
        const { key_id, secret } = generateApiKey();    
        const secret_hash = await hashSecret(secret);
        await ApiKey.create({
            userId: "2724e3bb-b630-4179-83f2-8d2cb304086c",
            key_id,
            secret_hash
        });
        console.log({
            api_key: { key_id, secret }, // ⚠️ NEVER store the plaintext; only show now
          });
    } catch (error) {
        console.log(error);
    }   
}

async function main() {
    await seedApiKey();
}

main();
