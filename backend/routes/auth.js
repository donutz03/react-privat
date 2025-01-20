const express = require('express');
const router = express.Router();
const db = require('../database/db'); // importăm conexiunea la bază de date
const { moveExpiredProducts } = require('../services/productService');
// auth.js

router.post('/register', async (req, res) => {
  const { username, password, phone, address } = req.body;
  
  if (!username || !password || !phone || !address) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  try {
    // Verificăm dacă utilizatorul există deja
    const userCheck = await db.query(
      'SELECT username FROM users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Utilizatorul există deja!' });
    }

    // Inserăm noul utilizator cu telefon și adresă
    await db.query(
      'INSERT INTO users (username, password, phone, address) VALUES ($1, $2, $3, $4)',
      [username, password, phone, address]
    );

    res.status(201).json({ message: 'Cont creat cu succes!' });
  } catch (error) {
    console.error('Eroare la înregistrare:', error);
    res.status(500).json({ message: 'Eroare la crearea contului!' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  try {
    // Verificăm credențialele
    const result = await db.query(
      'SELECT id, username, phone, address FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credențiale invalide!' });
    }

    // Verificăm și mutăm produsele expirate
    const products = await moveExpiredProducts(username);

    res.json({ 
      message: 'Autentificare reușită!',
      user: {
        username: result.rows[0].username,
        phone: result.rows[0].phone,
        address: result.rows[0].address
      },
      products
    });
  } catch (error) {
    console.error('Eroare la autentificare:', error);
    res.status(500).json({ message: 'Eroare la autentificare!' });
  }
});

module.exports = router;