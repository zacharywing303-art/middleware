const { User } = require('../models');
const { generateApiKey } = require('../lib/crypto-utils');
const { ApiKey } = require('../models');
const { hashSecret } = require('../lib/crypto-utils');
const crypto = require('crypto');
const { createApp, createEndpoint } = require('../lib/svix');

const _user = {
    email: 'test2@test.com',
    is_active: true,
    callback_url: 'https://82aea3a1f17a.ngrok-free.app/test',
    client_secret: 'whsec_' + crypto.randomBytes(32).toString('hex'),  
};

const seedUsers = async () => {
  try {
    const user = await User.create({
        ..._user,
    });

    const { key_id, secret } = generateApiKey();    
    const secret_hash = await hashSecret(secret);
    await ApiKey.create({
        userId: user.id,
        key_id,
        secret_hash
    });

    const app = await createApp('test2');
    await createEndpoint(user.callback_url, app.id);
    user.svix_app_id = app.id;
    await user.save();

    // Return secret ONCE — display to partner and ask them to save it
    console.log({
        user: { id: user.id, email: user.email },
        api_key: { key_id, secret }, // ⚠️ NEVER store the plaintext; only show now
      });
      return user;
} catch (error) {
    console.log(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
        console.log('User already exists');
    } else {
        console.log('Something went wrong');
    }
}
};

(async () => {
    await seedUsers();
})();
// module.exports = seedUsers;