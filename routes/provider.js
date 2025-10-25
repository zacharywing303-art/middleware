const express = require('express');
const router = express.Router();
const { Provider } = require('../models');

router.get('/', async (req, res) => {
    const providers = await Provider.findAll();
    res.json(providers);
});

module.exports = router;