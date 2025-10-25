const express = require('express');
const router = express.Router();
const { Payment, UserWhopMap } = require('../models');
const handlerProvider = require('../handler/handler-provider');

router.get('/', async (req, res) => {
    const payments = await Payment.findAll();
    res.json(payments);
});

router.post('/', async (req, res) => {
    
    const { provider } = req.body;
    console.log(provider);
    const handler = handlerProvider[provider];
    console.log(handler);

    if (!handler) {
        return res.status(400).json({ error: 'Provider not found' });
    }
    
    if (!req.session) {
        return res.status(401).json({ error: 'Session not found' });
    }
    
    await handler(req, res);
});

router.get('/:id', async (req, res) => {
    const payment = await Payment.findByPk(req.params.id);
    res.json(payment);
});

router.put('/:id', async (req, res) => {
    const payment = await Payment.findByPk(req.params.id);
    await payment.update(req.body);
    res.json(payment);
});

router.delete('/:id', async (req, res) => {
    const payment = await Payment.findByPk(req.params.id);
    await payment.destroy();
    res.json({ message: 'Payment deleted' });
}); 

module.exports = router;