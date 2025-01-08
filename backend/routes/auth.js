const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('../utils/fileHelpers');
const { moveExpiredProducts } = require('../services/productService');
const config = require('../config/config');

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  const users = readFile(config.FILES.users);
  
  if (users[username]) {
    return res.status(400).json({ message: 'Utilizatorul există deja!' });
  }

  users[username] = { password };
  writeFile(config.FILES.users, users);

  const foods = readFile(config.FILES.foods);
  foods[username] = [];
  writeFile(config.FILES.foods, foods);

  res.status(201).json({ message: 'Cont creat cu succes!' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  const users = readFile(config.FILES.users);
  
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: 'Credențiale invalide!' });
  }

  const products = moveExpiredProducts(username);

  res.json({ 
    message: 'Autentificare reușită!',
    products
  });
});

module.exports = router;