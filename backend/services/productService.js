const db = require('../database/db');
const { isExpired, isNearExpiration } = require('../utils/dateHelpers');

const moveExpiredProducts = async (username) => {
  try {
    // Obținem ID-ul utilizatorului
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Utilizator negăsit');
    }

    const userId = userResult.rows[0].id;
    const currentDate = new Date().toISOString().split('T')[0];

    // Marcăm produsele expirate
    await db.query(
      `UPDATE foods 
       SET is_expired = true 
       WHERE user_id = $1 
       AND expiration_date < $2 
       AND is_expired = false`,
      [userId, currentDate]
    );

    // Obținem toate produsele pentru utilizator
    const foodsQuery = `
      SELECT f.*, 
             array_agg(fc.name) as categories 
      FROM foods f
      LEFT JOIN food_category_relations fcr ON f.id = fcr.food_id
      LEFT JOIN food_categories fc ON fcr.category_id = fc.id
      WHERE f.user_id = $1
      GROUP BY f.id`;

    const [available, unavailable, expired] = await Promise.all([
      // Produse disponibile (neexpirate și nemarcate ca disponibile)
      db.query(foodsQuery + ' AND NOT is_available AND NOT is_expired', [userId]),
      // Produse marcate ca disponibile și neexpirate
      db.query(foodsQuery + ' AND is_available AND NOT is_expired', [userId]),
      // Produse expirate
      db.query(foodsQuery + ' AND is_expired', [userId])
    ]);

    // Formatăm rezultatele pentru a păstra compatibilitatea cu codul existent
    const formatResults = (rows) => rows.map(row => ({
      name: row.name,
      expirationDate: row.expiration_date.toISOString().split('T')[0],
      categories: row.categories.filter(c => c !== null),
      isNearExpiration: isNearExpiration(row.expiration_date)
    }));

    return {
      available: formatResults(available.rows),
      unavailable: formatResults(unavailable.rows),
      expired: formatResults(expired.rows)
    };
  } catch (error) {
    console.error('Eroare la procesarea produselor expirate:', error);
    throw error;
  }
};

module.exports = {
  moveExpiredProducts
};