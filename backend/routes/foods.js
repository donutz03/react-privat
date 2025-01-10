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

// Add this to routes/foods.js

router.post('/:ownerUsername/claim/:foodId', async (req, res) => {
  const { ownerUsername, foodId } = req.params;
  const { claimedBy } = req.body; // username of the person claiming

  try {
      await db.query('BEGIN');

      // Get user IDs
      const [ownerResult, claimerResult] = await Promise.all([
          db.query('SELECT id, phone, address FROM users WHERE username = $1', [ownerUsername]),
          db.query('SELECT id FROM users WHERE username = $1', [claimedBy])
      ]);

      if (ownerResult.rows.length === 0 || claimerResult.rows.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'User not found' });
      }

      const ownerId = ownerResult.rows[0].id;
      const claimerId = claimerResult.rows[0].id;
      const ownerContact = {
          phone: ownerResult.rows[0].phone,
          address: ownerResult.rows[0].address
      };

      const foodResult = await db.query(
          'SELECT * FROM foods WHERE id = $1 AND user_id = $2 AND is_available = true AND claim_status = $3',
          [foodId, ownerId, 'unclaimed']
      );

      if (foodResult.rows.length === 0) {
          await db.query('ROLLBACK');
          return res.status(404).json({ message: 'Product not found or not available' });
      }

      // Update food status
      await db.query(
          'UPDATE foods SET claim_status = $1 WHERE id = $2',
          ['claimed', foodId]
      );

      // Create claimed product record
      await db.query(
          'INSERT INTO claimed_products (food_id, claimed_by, original_owner) VALUES ($1, $2, $3)',
          [foodId, claimerId, ownerId]
      );

      await db.query('COMMIT');

      // Return updated data
      const [claimedFoods, ownerFoods] = await Promise.all([
          getFoodsWithCategories(
              'WHERE f.user_id = $1 AND NOT f.is_expired',
              [claimerId]
          ),
          getFoodsWithCategories(
              'WHERE f.user_id = $1 AND f.is_available = true AND NOT f.is_expired',
              [ownerId]
          )
      ]);

      res.json({
          claimedFoods,
          ownerFoods,
          ownerContact
      });

  } catch (error) {
      await db.query('ROLLBACK');
      console.error('Error claiming product:', error);
      res.status(500).json({ message: 'Error claiming product' });
  }
});

router.get('/:username/claimed/:foodId', async (req, res) => {
  const { username, foodId } = req.params;

  try {
    // Modificăm query-ul pentru a obține detaliile celui mai recent proprietar care a făcut produsul disponibil
    const ownerDetailsQuery = `
      SELECT u.phone, u.address
      FROM foods f
      JOIN users u ON f.user_id = u.id  // Luăm detaliile utilizatorului care a făcut ultima dată produsul disponibil
      WHERE f.id = $1
    `;

    const result = await db.query(ownerDetailsQuery, [foodId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Detaliile produsului nu au fost găsite' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching claimed product details:', error);
    res.status(500).json({ message: 'Eroare la obținerea detaliilor produsului' });
  }
});

module.exports = router;