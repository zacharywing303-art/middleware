const express = require('express');
const router = express.Router();

router.post("/", (req, res) => {
    console.log("test", req.body);
    res.send("test");
});

module.exports = router;
