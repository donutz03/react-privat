const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /friends/tags - Obține toate tag-urile disponibile
router.get('/tags', async (req, res) => {
  try {
    const result = await db.query('SELECT name FROM friend_tags ORDER BY name');
    const tags = result.rows.map(row => row.name);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: 'Eroare la încărcarea etichetelor' });
  }
});

// GET /friends/:username - Obține toți prietenii unui utilizator
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Obținem ID-ul utilizatorului
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    // Obținem prietenii cu tag-urile lor
    const friendsQuery = `
      SELECT 
        u.username as friend_username,
        array_agg(ft.name) as tags
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN friendship_tags ftags ON f.id = ftags.friendship_id
      LEFT JOIN friend_tags ft ON ftags.tag_id = ft.id
      WHERE f.user_id = $1
      GROUP BY u.username
    `;
    const friendsResult = await db.query(friendsQuery, [userId]);

    // Obținem grupurile utilizatorului
    const groupsQuery = `
      SELECT 
        g.name,
        g.created_by,
        array_agg(u.username) as members
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON gm.user_id = u.id
      WHERE g.id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      GROUP BY g.id, g.name, g.created_by
    `;
    const groupsResult = await db.query(groupsQuery, [userId]);

    // Obținem lista de acces partajat
    const accessQuery = `
      SELECT u.username
      FROM shared_list_access sla
      JOIN users u ON sla.viewer_id = u.id
      WHERE sla.user_id = $1
    `;
    const accessResult = await db.query(accessQuery, [userId]);

    // Formatăm rezultatul pentru compatibilitate cu frontend-ul
    const friends = friendsResult.rows.reduce((acc, row) => {
      acc[row.friend_username] = row.tags.filter(tag => tag !== null);
      return acc;
    }, {});

    res.json({
      friends,
      groups: groupsResult.rows.map(group => ({
        name: group.name,
        members: group.members,
        createdBy: group.created_by
      })),
      sharedListAccess: accessResult.rows.map(row => row.username)
    });
  } catch (error) {
    console.error('Eroare la obținerea prietenilor:', error);
    res.status(500).json({ message: 'Eroare la obținerea prietenilor' });
  }
});

// POST /friends/:username/add - Adaugă un prieten nou
router.post('/:username/add', async (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;
  
  if (!friendUsername) {
    return res.status(400).json({ message: 'Username-ul prietenului este obligatoriu!' });
  }

  try {
    await db.query('BEGIN');

    // Verificăm dacă utilizatorul încearcă să se adauge pe sine
    if (username === friendUsername) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Nu te poți adăuga pe tine ca prieten!' });
    }

    // Obținem ID-urile utilizatorilor
    const [userResult, friendResult] = await Promise.all([
      db.query('SELECT id FROM users WHERE username = $1', [username]),
      db.query('SELECT id FROM users WHERE username = $1', [friendUsername])
    ]);

    if (userResult.rows.length === 0 || friendResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit!' });
    }

    const userId = userResult.rows[0].id;
    const friendId = friendResult.rows[0].id;

    // Verificăm dacă prietenia există deja
    const existingFriendship = await db.query(
      'SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2',
      [userId, friendId]
    );

    if (existingFriendship.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Utilizatorii sunt deja prieteni!' });
    }

    // Adăugăm prietenia
    await db.query(
      'INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2)',
      [userId, friendId]
    );

    await db.query('COMMIT');

    // Returnăm lista actualizată de prieteni
    const friendsResult = await db.query(`
      SELECT 
        u.username as friend_username,
        array_agg(ft.name) as tags
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN friendship_tags ftags ON f.id = ftags.friendship_id
      LEFT JOIN friend_tags ft ON ftags.tag_id = ft.id
      WHERE f.user_id = $1
      GROUP BY u.username
    `, [userId]);

    const friends = friendsResult.rows.reduce((acc, row) => {
      acc[row.friend_username] = row.tags.filter(tag => tag !== null);
      return acc;
    }, {});

    res.json({ friends });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la adăugarea prietenului:', error);
    res.status(500).json({ message: 'Eroare la adăugarea prietenului' });
  }
});

// PUT /friends/:username/friends/:friendUsername/tags - Actualizează tag-urile unui prieten
router.put('/:username/friends/:friendUsername/tags', async (req, res) => {
  const { username, friendUsername } = req.params;
  const { tags } = req.body;
  
  try {
    await db.query('BEGIN');

    // Obținem ID-urile necesare
    const [userResult, friendResult] = await Promise.all([
      db.query('SELECT id FROM users WHERE username = $1', [username]),
      db.query('SELECT id FROM users WHERE username = $1', [friendUsername])
    ]);

    if (userResult.rows.length === 0 || friendResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit!' });
    }

    const userId = userResult.rows[0].id;
    const friendId = friendResult.rows[0].id;

    // Obținem ID-ul prieteniei
    const friendshipResult = await db.query(
      'SELECT id FROM friendships WHERE user_id = $1 AND friend_id = $2',
      [userId, friendId]
    );

    if (friendshipResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Prietenie negăsită!' });
    }

    const friendshipId = friendshipResult.rows[0].id;

    // Ștergem tag-urile vechi
    await db.query(
      'DELETE FROM friendship_tags WHERE friendship_id = $1',
      [friendshipId]
    );

    // Adăugăm tag-urile noi
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tagResult = await db.query(
          'SELECT id FROM friend_tags WHERE name = $1',
          [tagName]
        );
        if (tagResult.rows.length > 0) {
          await db.query(
            'INSERT INTO friendship_tags (friendship_id, tag_id) VALUES ($1, $2)',
            [friendshipId, tagResult.rows[0].id]
          );
        }
      }
    }

    await db.query('COMMIT');

    // Returnăm datele actualizate
    const updatedData = await getFriendData(userId);
    res.json(updatedData);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la actualizarea tag-urilor:', error);
    res.status(500).json({ message: 'Eroare la actualizarea tag-urilor' });
  }
});

// Helper function pentru obținerea datelor despre prieteni
async function getFriendData(userId) {
  const friendsQuery = `
    SELECT 
      u.username as friend_username,
      array_agg(ft.name) as tags
    FROM friendships f
    JOIN users u ON f.friend_id = u.id
    LEFT JOIN friendship_tags ftags ON f.id = ftags.friendship_id
    LEFT JOIN friend_tags ft ON ftags.tag_id = ft.id
    WHERE f.user_id = $1
    GROUP BY u.username
  `;
  
  const groupsQuery = `
    SELECT 
      g.name,
      g.created_by,
      array_agg(u.username) as members
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    JOIN users u ON gm.user_id = u.id
    WHERE g.id IN (
      SELECT group_id FROM group_members WHERE user_id = $1
    )
    GROUP BY g.id, g.name, g.created_by
  `;
  
  const accessQuery = `
    SELECT u.username
    FROM shared_list_access sla
    JOIN users u ON sla.viewer_id = u.id
    WHERE sla.user_id = $1
  `;

  const [friendsResult, groupsResult, accessResult] = await Promise.all([
    db.query(friendsQuery, [userId]),
    db.query(groupsQuery, [userId]),
    db.query(accessQuery, [userId])
  ]);

  return {
    friends: friendsResult.rows.reduce((acc, row) => {
      acc[row.friend_username] = row.tags.filter(tag => tag !== null);
      return acc;
    }, {}),
    groups: groupsResult.rows.map(group => ({
      name: group.name,
      members: group.members,
      createdBy: group.created_by
    })),
    sharedListAccess: accessResult.rows.map(row => row.username)
  };
}

// POST /friends/:username/groups - Creează un grup nou
router.post('/:username/groups', async (req, res) => {
  const { username } = req.params;
  const { groupName, members } = req.body;
  
  if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ message: 'Numele grupului și cel puțin un membru sunt necesare!' });
  }

  try {
    await db.query('BEGIN');

    // Obținem ID-ul creatorului
    const creatorResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (creatorResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const creatorId = creatorResult.rows[0].id;

    // Creăm grupul
    const groupResult = await db.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id',
      [groupName, creatorId]
    );
    const groupId = groupResult.rows[0].id;

    // Adăugăm creatorul în grup
    await db.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [groupId, creatorId]
    );

    // Adăugăm membrii în grup
    for (const memberUsername of members) {
      const memberResult = await db.query('SELECT id FROM users WHERE username = $1', [memberUsername]);
      if (memberResult.rows.length > 0) {
        await db.query(
          'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
          [groupId, memberResult.rows[0].id]
        );
      }
    }

    await db.query('COMMIT');

    // Returnăm datele actualizate
    const updatedData = await getFriendData(creatorId);
    res.json(updatedData);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la crearea grupului:', error);
    res.status(500).json({ message: 'Eroare la crearea grupului' });
  }
});

// GET /friends/:username/groups - Obține toate grupurile unui utilizator
router.get('/:username/groups', async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    const groupsQuery = `
      SELECT 
        g.id,
        g.name,
        u_creator.username as created_by,
        array_agg(u_member.username) as members
      FROM groups g
      JOIN users u_creator ON g.created_by = u_creator.id
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u_member ON gm.user_id = u_member.id
      WHERE g.id IN (
        SELECT group_id FROM group_members WHERE user_id = $1
      )
      GROUP BY g.id, g.name, u_creator.username
      ORDER BY g.created_at DESC
    `;

    const groupsResult = await db.query(groupsQuery, [userId]);
    res.json(groupsResult.rows);
  } catch (error) {
    console.error('Eroare la obținerea grupurilor:', error);
    res.status(500).json({ message: 'Eroare la obținerea grupurilor' });
  }
});

// DELETE /friends/:username/groups/:groupId - Șterge un grup
router.delete('/:username/groups/:groupId', async (req, res) => {
  const { username, groupId } = req.params;

  try {
    await db.query('BEGIN');

    // Verificăm dacă utilizatorul este creatorul grupului
    const groupCheck = await db.query(`
      SELECT g.id 
      FROM groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = $1 AND u.username = $2
    `, [groupId, username]);

    if (groupCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(403).json({ message: 'Nu aveți permisiunea de a șterge acest grup' });
    }

    // Ștergem membrii grupului
    await db.query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
    
    // Ștergem grupul
    await db.query('DELETE FROM groups WHERE id = $1', [groupId]);

    await db.query('COMMIT');

    // Returnăm grupurile rămase
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const updatedData = await getFriendData(userResult.rows[0].id);
    res.json(updatedData);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la ștergerea grupului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea grupului' });
  }
});

// PUT /friends/:username/groups/:groupId/members - Actualizează membrii unui grup
router.put('/:username/groups/:groupId/members', async (req, res) => {
  const { username, groupId } = req.params;
  const { members } = req.body;

  if (!Array.isArray(members)) {
    return res.status(400).json({ message: 'Lista de membri este invalidă' });
  }

  try {
    await db.query('BEGIN');

    // Verificăm dacă utilizatorul este creatorul grupului
    const groupCheck = await db.query(`
      SELECT g.id 
      FROM groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.id = $1 AND u.username = $2
    `, [groupId, username]);

    if (groupCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest grup' });
    }

    // Ștergem membrii existenți (cu excepția creatorului)
    await db.query(`
      DELETE FROM group_members 
      WHERE group_id = $1 
      AND user_id != (SELECT id FROM users WHERE username = $2)
    `, [groupId, username]);

    // Adăugăm noii membri
    for (const memberUsername of members) {
      if (memberUsername !== username) { // Nu adăugăm din nou creatorul
        const memberResult = await db.query('SELECT id FROM users WHERE username = $1', [memberUsername]);
        if (memberResult.rows.length > 0) {
          await db.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [groupId, memberResult.rows[0].id]
          );
        }
      }
    }

    await db.query('COMMIT');

    // Returnăm datele actualizate
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    const updatedData = await getFriendData(userResult.rows[0].id);
    res.json(updatedData);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la actualizarea membrilor grupului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea membrilor grupului' });
  }
});

// POST /friends/:username/share - Actualizează accesul la lista de produse
router.post('/:username/share', async (req, res) => {
  const { username } = req.params;
  const { selectedFriends } = req.body;
  
  if (!Array.isArray(selectedFriends)) {
    return res.status(400).json({ message: 'Lista de prieteni selectați este invalidă!' });
  }

  try {
    await db.query('BEGIN');

    // Obținem ID-ul utilizatorului
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    // Ștergem toate permisiunile existente
    await db.query('DELETE FROM shared_list_access WHERE user_id = $1', [userId]);

    // Adăugăm noile permisiuni
    for (const friendUsername of selectedFriends) {
      const friendResult = await db.query('SELECT id FROM users WHERE username = $1', [friendUsername]);
      if (friendResult.rows.length > 0) {
        await db.query(
          'INSERT INTO shared_list_access (user_id, viewer_id) VALUES ($1, $2)',
          [userId, friendResult.rows[0].id]
        );
      }
    }

    await db.query('COMMIT');

    // Returnăm datele actualizate
    const updatedData = await getFriendData(userId);
    res.json(updatedData);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Eroare la actualizarea accesului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea accesului' });
  }
});

// GET /friends/:username/filter - Filtrează prietenii după tag-uri
router.get('/:username/filter', async (req, res) => {
  const { username } = req.params;
  const { tags } = req.query;

  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    let friendsQuery = `
      SELECT 
        u.username as friend_username,
        array_agg(ft.name) as tags
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN friendship_tags ftags ON f.id = ftags.friendship_id
      LEFT JOIN friend_tags ft ON ftags.tag_id = ft.id
      WHERE f.user_id = $1
    `;

    const queryParams = [userId];

    // Dacă sunt specificate tag-uri pentru filtrare
    if (tags) {
      const tagArray = tags.split(',');
      const tagPlaceholders = tagArray.map((_, idx) => `$${idx + 2}`).join(',');
      
      friendsQuery += `
        AND f.id IN (
          SELECT ft.friendship_id
          FROM friendship_tags ft
          JOIN friend_tags t ON ft.tag_id = t.id
          WHERE t.name IN (${tagPlaceholders})
          GROUP BY ft.friendship_id
          HAVING COUNT(DISTINCT t.name) = $${tagArray.length + 2}
        )
      `;
      
      queryParams.push(...tagArray, tagArray.length);
    }

    friendsQuery += ' GROUP BY u.username';

    const friendsResult = await db.query(friendsQuery, queryParams);

    // Formatăm rezultatul pentru frontend
    const friends = friendsResult.rows.reduce((acc, row) => {
      acc[row.friend_username] = row.tags.filter(tag => tag !== null);
      return acc;
    }, {});

    res.json({ friends });
  } catch (error) {
    console.error('Eroare la filtrarea prietenilor:', error);
    res.status(500).json({ message: 'Eroare la filtrarea prietenilor' });
  }
});

// In friends.js

// GET /friends/:username/shared-products endpoint
router.get('/:username/shared-products', async (req, res) => {
  const { username } = req.params;

  try {
    // First get the user's ID
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizator negăsit' });
    }
    const userId = userResult.rows[0].id;

    // This query gets shared products with their images and other details
    const sharedProductsQuery = `
      SELECT 
        u.username as friend_username,
        f.id,
        f.name,
        f.expiration_date,
        CASE 
          WHEN f.image_data IS NOT NULL 
          THEN concat('/foods/image/', f.id::text)
          ELSE NULL 
        END as image_url,
        array_agg(DISTINCT fc.name) as categories
      FROM users u
      JOIN shared_list_access sla ON u.id = sla.user_id
      JOIN foods f ON u.id = f.user_id
      LEFT JOIN food_category_relations fcr ON f.id = fcr.food_id
      LEFT JOIN food_categories fc ON fcr.category_id = fc.id
      WHERE sla.viewer_id = $1
        AND f.is_available = true
        AND f.is_expired = false
        AND f.image_data IS NOT NULL  -- Only get products with images
      GROUP BY 
        u.username, 
        f.id, 
        f.name, 
        f.expiration_date,
        f.image_data
      ORDER BY u.username, f.expiration_date
    `;

    const result = await db.query(sharedProductsQuery, [userId]);

    // Transform the results into an organized structure by friend
    const sharedProducts = result.rows.reduce((acc, row) => {
      // If this is the first product for this friend, create their array
      if (!acc[row.friend_username]) {
        acc[row.friend_username] = [];
      }
      
      // Add the product to the friend's array
      acc[row.friend_username].push({
        id: row.id,
        name: row.name,
        expirationDate: row.expiration_date.toISOString().split('T')[0],
        imageUrl: row.image_url,  // Include the image URL
        categories: row.categories.filter(c => c !== null)
      });
      
      return acc;
    }, {});

    res.json(sharedProducts);
  } catch (error) {
    console.error('Eroare la obținerea produselor partajate:', error);
    res.status(500).json({ message: 'Eroare la obținerea produselor partajate' });
  }
});

router.post('/:ownerUsername/claim/:foodId', async (req, res) => {
  const { ownerUsername, foodId } = req.params;
  const { claimedBy } = req.body;

  try {
    await db.query('BEGIN');

    // Get user IDs
    const [ownerResult, claimerResult] = await Promise.all([
      db.query('SELECT id FROM users WHERE username = $1', [ownerUsername]),
      db.query('SELECT id FROM users WHERE username = $1', [claimedBy])
    ]);

    if (ownerResult.rows.length === 0 || claimerResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    const ownerId = ownerResult.rows[0].id;
    const claimerId = claimerResult.rows[0].id;

    // Check if the product is available and not expired
    const foodResult = await db.query(
      `SELECT * FROM foods 
       WHERE id = $1 
       AND user_id = $2 
       AND is_available = true 
       AND is_expired = false`,
      [foodId, ownerId]
    );

    if (foodResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found or not available' });
    }

    // Update the product ownership and availability
    await db.query(
      `UPDATE foods 
       SET user_id = $1, 
           is_available = false 
       WHERE id = $2`,
      [claimerId, foodId]
    );

    await db.query('COMMIT');

    res.json({
      message: 'Product claimed successfully'
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error claiming product:', error);
    res.status(500).json({ message: 'Error claiming product' });
  }
});
module.exports = router;