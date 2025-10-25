const express = require('express');
const router = express.Router();

router.post('/webhook', (req, res) => {
    console.log(req.body);
    res.send('ok');
}); 

router.get('/', (req, res) => {
    console.log(req.body);
    res.send('ok');
}); 

module.exports = router;