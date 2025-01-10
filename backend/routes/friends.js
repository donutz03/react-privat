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

module.exports = router;