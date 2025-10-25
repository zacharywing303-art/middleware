var express = require('express');
var router = express.Router();
const { User } = require('../models');
const { generateApiKey } = require('../lib/crypto-utils');
const { ApiKey } = require('../models');

/* GET users listing. */
router.get('/', async function(req, res, next) {
    const users = await User.findAll();
    res.json(users);
});

router.post('/', async function(req, res, next) {
    try {
        const user = await User.create({
            ...req.body,
        });

        const { key_id, secret } = generateApiKey();    
        const secret_hash = await hashSecret(secret);
        await ApiKey.create({
            userId: user.id,
            key_id,
            secret_hash
        });

        // Return secret ONCE — display to partner and ask them to save it
        res.status(201).json({
            user: { id: user.id, email: user.email },
            api_key: { key_id, secret }, // ⚠️ NEVER store the plaintext; only show now
          });
    } catch (error) {
        console.log(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'User already exists' });
        } else {
            return res.status(400).json({ error: 'Something went wrong' });
        }
    }
});

module.exports = router;
