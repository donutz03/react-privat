const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { isNearExpiration } = require('../utils/dateHelpers');
const { moveExpiredProducts } = require('../services/productService');


const multer = require('multer');
const storage = multer.memoryStorage(); // Stocăm imaginea în memorie în loc de disk
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limită de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Doar imagini sunt permise!'));
    }
  }
});

router.post('/check-expired/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const userId = userResult.rows[0].id;

    await db.query(
      `UPDATE foods 
       SET is_expired = true, is_available = false 
       WHERE user_id = $1 
       AND expiration_date < $2 
       AND is_expired = false`,
      [userId, currentDate]
    );

    const expiredProducts = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND f.is_expired = true',
      [userId]
    );

    res.json({ message: 'Verificare completă', expiredProducts });
  } catch (error) {
    console.error('Eroare la verificarea produselor expirate:', error);
    res.status(500).json({ message: 'Eroare la verificarea produselor expirate' });
  }
});

// 2. Rută pentru ștergerea unui produs expirat specific
router.delete('/expired/:username/:id', async (req, res) => {
  const { username, id } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    await db.query('BEGIN');
    
    await db.query('DELETE FROM food_category_relations WHERE food_id = $1', [id]);
    
    await db.query(
      'DELETE FROM foods WHERE id = $1 AND user_id = $2 AND is_expired = true',
      [id, userId]
    );

    await db.query('COMMIT');

    const expiredProducts = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND f.is_expired = true',
      [userId]
    );

    res.json(expiredProducts);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la ștergerea produsului expirat:', error);
    res.status(500).json({ message: 'Eroare la ștergerea produsului' });
  }
});

// 3. Rută pentru ștergerea tuturor produselor expirate ale unui utilizator
router.delete('/expired/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    await db.query('BEGIN');

    await db.query(`
      DELETE FROM food_category_relations 
      WHERE food_id IN (
        SELECT id FROM foods 
        WHERE user_id = $1 AND is_expired = true
      )`, [userId]);
    
    await db.query(
      'DELETE FROM foods WHERE user_id = $1 AND is_expired = true',
      [userId]
    );

    await db.query('COMMIT');

    res.json([]); // Returnăm array gol pentru că am șters toate produsele expirate
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la ștergerea produselor expirate:', error);
    res.status(500).json({ message: 'Eroare la ștergerea produselor expirate' });
  }
});

// 4. Rută pentru obținerea produselor expirate
router.get('/expired/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    const expiredProducts = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND f.is_expired = true',
      [userId]
    );

    res.json(expiredProducts);
  } catch (error) {
    console.error('Eroare la obținerea produselor expirate:', error);
    res.status(500).json({ message: 'Eroare la obținerea produselor expirate' });
  }
});

// În foods.js, funcția POST
router.post('/:username', upload.single('image'), async (req, res) => {
  const { username } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories) {
    return res.status(400).json({ 
      message: 'Numele și data expirării sunt obligatorii.' 
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

    // Inserăm produsul cu imagine dacă există
    let foodResult;
    if (req.file) {
      foodResult = await db.query(
        'INSERT INTO foods (user_id, name, expiration_date, image_data, image_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, name, expirationDate, req.file.buffer, req.file.mimetype]
      );
    } else {
      foodResult = await db.query(
        'INSERT INTO foods (user_id, name, expiration_date) VALUES ($1, $2, $3) RETURNING id',
        [userId, name, expirationDate]
      );
    }
    const foodId = foodResult.rows[0].id;

    // Inserăm categoriile
    const categoriesArray = Array.isArray(categories) ? categories : JSON.parse(categories);
    for (const categoryName of categoriesArray) {
      const categoryResult = await db.query(
        'SELECT id FROM food_categories WHERE name = $1',
        [categoryName]
      );
      await db.query(
        'INSERT INTO food_category_relations (food_id, category_id) VALUES ($1, $2)',
        [foodId, categoryResult.rows[0].id]
      );
    }

    await db.query('COMMIT');

    // Returnăm lista actualizată folosind getFoodsWithCategories
    const updatedFoods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND NOT f.is_available AND NOT f.is_expired',
      [userId]
    );

    // Verificăm că returnăm un array
    res.status(201).json(Array.isArray(updatedFoods) ? updatedFoods : []);

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la adăugarea produsului:', error);
    res.status(500).json({ message: 'Eroare la adăugarea produsului' });
  }
});

router.get('/image/:foodId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT image_data, image_type FROM foods WHERE id = $1',
      [req.params.foodId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].image_data) {
      return res.status(404).send('Imagine negăsită');
    }

    const { image_data, image_type } = result.rows[0];
    res.set('Content-Type', image_type);
    res.send(image_data);
  } catch (error) {
    console.error('Eroare la obținerea imaginii:', error);
    res.status(500).send('Eroare la obținerea imaginii');
  }
});

const getFoodsWithCategories = async (query, params) => {
  const result = await db.query(`
    SELECT f.*, 
           array_agg(fc.name) as categories,
           to_char(f.expiration_date, 'YYYY-MM-DD') as formatted_date,
           CASE WHEN f.image_data IS NOT NULL THEN true ELSE false END as has_image
    FROM foods f
    LEFT JOIN food_category_relations fcr ON f.id = fcr.food_id
    LEFT JOIN food_categories fc ON fcr.category_id = fc.id
    ${query}
    GROUP BY f.id
  `, params);

  return result.rows.map(food => ({
    id: food.id,
    name: food.name,
    expirationDate: food.formatted_date,
    categories: food.categories.filter(c => c !== null),
    isNearExpiration: isNearExpiration(new Date(food.formatted_date)),
    hasImage: food.has_image,
    imageUrl: food.has_image ? `/foods/image/${food.id}` : null
  }));
};
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const foods = await getFoodsWithCategories(
      `WHERE f.user_id = $1 
       AND is_available = false 
       AND is_expired = false`,
      [userId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Update the get unavailable products endpoint
router.get('/unavailable/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const foods = await getFoodsWithCategories(
      `WHERE f.user_id = $1 
       AND is_available = true 
       AND is_expired = false`,
      [userId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Error fetching unavailable products:', error);
    res.status(500).json({ message: 'Error fetching unavailable products' });
  }
});

// Adaugă acest endpoint în foods.js
router.put('/unavailable/:username/:id', upload.single('image'), async (req, res) => {
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

    // Actualizăm produsul, inclusiv imaginea dacă există
    if (req.file) {
      await db.query(
        'UPDATE foods SET name = $1, expiration_date = $2, image_data = $3, image_type = $4 WHERE id = $5 AND user_id = $6 AND is_available = true',
        [name, expirationDate, req.file.buffer, req.file.mimetype, id, userId]
      );
    } else {
      await db.query(
        'UPDATE foods SET name = $1, expiration_date = $2 WHERE id = $3 AND user_id = $4 AND is_available = true',
        [name, expirationDate, id, userId]
      );
    }

    // Ștergem relațiile vechi cu categoriile
    await db.query('DELETE FROM food_category_relations WHERE food_id = $1', [id]);

    // Adăugăm noile relații cu categoriile
    const categoriesArray = Array.isArray(categories) ? categories : JSON.parse(categories);
    for (const categoryName of categoriesArray) {
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

    // Returnăm lista actualizată de produse disponibile
    const updatedFoods = await getFoodsWithCategories(
      'WHERE f.user_id = $1 AND f.is_available = true AND NOT f.is_expired',
      [userId]
    );
    res.json(updatedFoods);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la actualizarea produsului disponibil:', error);
    res.status(500).json({ message: 'Eroare la actualizarea produsului' });
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
      'INSERT INTO foods (user_id, name, expiration_date) VALUES ($1, $2, $3::date) RETURNING id',
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

router.put('/:username/:id', upload.single('image'), async (req, res) => {
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

    // Actualizăm produsul, inclusiv imaginea dacă există
    if (req.file) {
      await db.query(
        'UPDATE foods SET name = $1, expiration_date = $2, image_data = $3, image_type = $4 WHERE id = $5 AND user_id = $6',
        [name, expirationDate, req.file.buffer, req.file.mimetype, id, userId]
      );
    } else {
      await db.query(
        'UPDATE foods SET name = $1, expiration_date = $2 WHERE id = $3 AND user_id = $4',
        [name, expirationDate, id, userId]
      );
    }

    // Ștergem relațiile vechi cu categoriile
    await db.query('DELETE FROM food_category_relations WHERE food_id = $1', [id]);

    // Adăugăm noile relații cu categoriile
    const categoriesArray = Array.isArray(categories) ? categories : JSON.parse(categories);
    for (const categoryName of categoriesArray) {
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

router.post('/:ownerUsername/claim/:foodId', async (req, res) => {
  const { ownerUsername, foodId } = req.params;
  const { claimedBy } = req.body;

  try {
    await db.query('BEGIN');

    // Get user IDs and contact information
    const [ownerResult, claimerResult] = await Promise.all([
      db.query('SELECT id, phone, address FROM users WHERE username = $1', [ownerUsername]),
      db.query('SELECT id FROM users WHERE username = $1', [claimedBy])
    ]);

    if (ownerResult.rows.length === 0 || claimerResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }

    const ownerId = ownerResult.rows[0].id;
    const claimerId = claimerResult.rows[0].id;
    const ownerContact = {
      phone: ownerResult.rows[0].phone,
      address: ownerResult.rows[0].address
    };

    // Find the original food item
    const foodResult = await db.query(
      'SELECT * FROM foods WHERE id = $1 AND user_id = $2 AND is_available = true AND is_expired = false',
      [foodId, ownerId]
    );

    if (foodResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Produsul nu a fost găsit sau nu este disponibil' });
    }

    const originalFood = foodResult.rows[0];

    // Insert a new food item for the claimer
    const newFoodResult = await db.query(
      `INSERT INTO foods 
        (user_id, name, expiration_date, is_available, is_expired, claim_status) 
       VALUES 
        ($1, $2, $3, false, false, 'claimed')
       RETURNING id`,
      [claimerId, originalFood.name, originalFood.expiration_date]
    );

    const newFoodId = newFoodResult.rows[0].id;

    // Copy categories to the new food item
    const categoriesResult = await db.query(
      'SELECT category_id FROM food_category_relations WHERE food_id = $1',
      [foodId]
    );

    for (const categoryRow of categoriesResult.rows) {
      await db.query(
        'INSERT INTO food_category_relations (food_id, category_id) VALUES ($1, $2)',
        [newFoodId, categoryRow.category_id]
      );
    }

    // Update the original food item
    await db.query(
      'UPDATE foods SET is_available = false, claim_status = $1 WHERE id = $2',
      ['claimed', foodId]
    );

    // Create a record of the claim
    await db.query(
      'INSERT INTO claimed_products (food_id, claimed_by, original_owner) VALUES ($1, $2, $3)',
      [foodId, claimerId, ownerId]
    );

    await db.query('COMMIT');

    res.json({
      message: 'Produs revendicat cu succes',
      ownerContact
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la revendicarea produsului:', error);
    res.status(500).json({ message: 'Eroare la revendicarea produsului' });
  }
});

// GET /foods/:ownerUsername/claimed/:foodId - Get contact details for a claimed product
router.get('/:ownerUsername/claimed/:foodId', async (req, res) => {
  const { ownerUsername, foodId } = req.params;

  try {
    // Find the user who originally made the product available
    const query = `
      SELECT u.phone, u.address
      FROM users u
      JOIN foods f ON f.user_id = u.id
      WHERE f.id = $1
    `;

    const result = await db.query(query, [foodId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Detalii produs negăsite' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Eroare la obținerea detaliilor de contact:', error);
    res.status(500).json({ message: 'Eroare la obținerea detaliilor' });
  }
});

module.exports = router;