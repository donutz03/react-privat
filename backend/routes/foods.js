const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isNearExpiration } = require('../utils/dateHelpers');

const getFoodsWithCategories = async (query, params) => {
  const result = await db.query(`
    SELECT f.*, 
           array_agg(fc.name) as categories 
    FROM foods f
    LEFT JOIN food_category_relations fcr ON f.id = fcr.food_id
    LEFT JOIN food_categories fc ON fcr.category_id = fc.id
    ${query}
    GROUP BY f.id
  `, params);

  return result.rows.map(food => ({
    id: food.id,
    name: food.name,
    expirationDate: food.expiration_date.toISOString().split('T')[0],
    categories: food.categories.filter(c => c !== null),
    isNearExpiration: isNearExpiration(food.expiration_date)
  }));
};

// GET /foods/:username - Obține produsele disponibile ale unui utilizator
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }

    const userId = userResult.rows[0].id;
    const foods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND is_available = false AND is_expired = false',
      [userId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Eroare la obținerea produselor:', error);
    res.status(500).json({ message: 'Eroare la obținerea produselor' });
  }
});

// GET /foods/unavailable/:username - Obține produsele marcate ca disponibile
router.get('/unavailable/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }

    const userId = userResult.rows[0].id;
    const foods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND is_available = true AND is_expired = false',
      [userId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Eroare la obținerea produselor disponibile:', error);
    res.status(500).json({ message: 'Eroare la obținerea produselor disponibile' });
  }
});

// GET /foods/expired/:username - Obține produsele expirate
router.get('/expired/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }

    const userId = userResult.rows[0].id;
    const foods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND is_expired = true',
      [userId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Eroare la obținerea produselor expirate:', error);
    res.status(500).json({ message: 'Eroare la obținerea produselor expirate' });
  }
});


router.post('/:username', async (req, res) => {
  const { username } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ 
      message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' 
    });
  }

  try {
    await db.query('BEGIN'); // Începem o tranzacție

    // Obținem user ID
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    // Inserăm produsul
    const foodResult = await db.query(
      'INSERT INTO foods (user_id, name, expiration_date) VALUES ($1, $2, $3) RETURNING id',
      [userId, name, expirationDate]
    );
    const foodId = foodResult.rows[0].id;

    // Inserăm relațiile cu categoriile
    for (const categoryName of categories) {
      const categoryResult = await db.query(
        'SELECT id FROM food_categories WHERE name = $1',
        [categoryName]
      );
      const categoryId = categoryResult.rows[0].id;
      
      await db.query(
        'INSERT INTO food_category_relations (food_id, category_id) VALUES ($1, $2)',
        [foodId, categoryId]
      );
    }

    await db.query('COMMIT');

    // Returnăm lista actualizată de produse
    const updatedFoods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND NOT f.is_available AND NOT f.is_expired',
      [userId]
    );
    res.status(201).json(updatedFoods);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la adăugarea produsului:', error);
    res.status(500).json({ message: 'Eroare la adăugarea produsului' });
  }
});

// DELETE /foods/:username/:id - Șterge un produs
router.delete('/:username/:id', async (req, res) => {
  const { username, id } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    await db.query('BEGIN');

    // Ștergem mai întâi relațiile cu categoriile
    await db.query('DELETE FROM food_category_relations WHERE food_id = $1', [id]);
    
    // Apoi ștergem produsul
    await db.query(
      'DELETE FROM foods WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    await db.query('COMMIT');

    // Returnăm lista actualizată
    const updatedFoods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND NOT f.is_available AND NOT f.is_expired',
      [userId]
    );
    res.json(updatedFoods);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la ștergerea produsului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea produsului' });
  }
});

// PUT /foods/:username/toggle-availability/:id - Modifică disponibilitatea unui produs
router.post('/:username/toggle-availability/:id', async (req, res) => {
  const { username, id } = req.params;
  const { makeAvailable } = req.body;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    await db.query(
      'UPDATE foods SET is_available = $1 WHERE id = $2 AND user_id = $3',
      [makeAvailable, id, userId]
    );

    // Returnăm listele actualizate
    const [available, unavailable] = await Promise.all([
      getFoodsWithCategories(
        'WHERE f.user_id = $1 AND NOT f.is_available AND NOT f.is_expired',
        [userId]
      ),
      getFoodsWithCategories(
        'WHERE f.user_id = $1 AND f.is_available AND NOT f.is_expired',
        [userId]
      )
    ]);

    res.json({
      available,
      unavailable
    });
  } catch (error) {
    console.error('Eroare la modificarea disponibilității:', error);
    res.status(500).json({ message: 'Eroare la modificarea disponibilității' });
  }
});

// PUT /foods/:username/:id - Modifică un produs
router.put('/:username/:id', async (req, res) => {
  const { username, id } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ 
      message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' 
    });
  }

  try {
    await db.query('BEGIN');

    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    // Actualizăm produsul
    await db.query(
      'UPDATE foods SET name = $1, expiration_date = $2 WHERE id = $3 AND user_id = $4',
      [name, expirationDate, id, userId]
    );

    // Ștergem relațiile vechi cu categoriile
    await db.query('DELETE FROM food_category_relations WHERE food_id = $1', [id]);

    // Adăugăm noile relații cu categoriile
    for (const categoryName of categories) {
      const categoryResult = await db.query(
        'SELECT id FROM food_categories WHERE name = $1',
        [categoryName]
      );
      const categoryId = categoryResult.rows[0].id;
      
      await db.query(
        'INSERT INTO food_category_relations (food_id, category_id) VALUES ($1, $2)',
        [id, categoryId]
      );
    }

    await db.query('COMMIT');

    // Returnăm lista actualizată
    const updatedFoods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND NOT f.is_available AND NOT f.is_expired',
      [userId]
    );
    res.json(updatedFoods);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la actualizarea produsului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea produsului' });
  }
});

module.exports = router;