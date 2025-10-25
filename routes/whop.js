const express = require('express');
const router = express.Router();
const { Whop } = require('../models');
const { WhopPlan } = require('../models');

router.get('/', async (req, res) => {
    const whops = await Whop.findAll();
    res.json(whops);
});

router.get('/:id', async (req, res) => {
    const whop = await Whop.findByPk(req.params.id);
    res.json(whop);
});

router.get('/:id/plans', async (req, res) => {
    const whop = await Whop.findByPk(req.params.id);
    const plans = await WhopPlan.findAll({ where: { whopId: whop.id } });
    res.json(plans);
});

module.exports = router;
