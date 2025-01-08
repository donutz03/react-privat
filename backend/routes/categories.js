const express = require('express');
const router = express.Router();
const fs = require('fs');
const config = require('../config/config');

router.get('/', (req, res) => {
  fs.readFile(config.FILES.categories, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea categoriilor.');
    const categories = data ? JSON.parse(data) : [];
    res.json(categories);
  });
});

module.exports = router;