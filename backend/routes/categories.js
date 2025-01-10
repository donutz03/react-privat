const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /categories - Obține toate categoriile
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT name FROM food_categories ORDER BY name ASC'
    );
    
    // Transformăm rezultatul într-un array de nume de categorii
    // pentru a păstra compatibilitatea cu frontend-ul
    const categories = result.rows.map(row => row.name);
    
    res.json(categories);
  } catch (error) {
    console.error('Eroare la obținerea categoriilor:', error);
    res.status(500).json({ message: 'Eroare la citirea categoriilor' });
  }
});

// Opțional: Endpoint pentru adăugarea de categorii noi
router.post('/', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Numele categoriei este obligatoriu!' });
  }

  try {
    await db.query(
      'INSERT INTO food_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
    
    // Returnăm lista actualizată de categorii
    const result = await db.query('SELECT name FROM food_categories ORDER BY name ASC');
    const categories = result.rows.map(row => row.name);
    
    res.status(201).json(categories);
  } catch (error) {
    console.error('Eroare la adăugarea categoriei:', error);
    res.status(500).json({ message: 'Eroare la adăugarea categoriei' });
  }
});

// Opțional: Endpoint pentru ștergerea categoriilor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Verificăm mai întâi dacă categoria este folosită
    const usageCheck = await db.query(
      'SELECT COUNT(*) FROM food_category_relations WHERE category_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Această categorie este folosită de produse și nu poate fi ștearsă' 
      });
    }

    await db.query('DELETE FROM food_categories WHERE id = $1', [id]);
    
    const result = await db.query('SELECT name FROM food_categories ORDER BY name ASC');
    const categories = result.rows.map(row => row.name);
    
    res.json(categories);
  } catch (error) {
    console.error('Eroare la ștergerea categoriei:', error);
    res.status(500).json({ message: 'Eroare la ștergerea categoriei' });
  }
});

module.exports = router;