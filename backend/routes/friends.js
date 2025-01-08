const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('../utils/fileHelpers');
const config = require('../config/config');

router.get('/tags', (req, res) => {
  try {
    const tags = readFile(config.FILES.friendTags);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: 'Eroare la încărcarea etichetelor' });
  }
});

router.get('/:username', (req, res) => {
  const { username } = req.params;
  const friendsData = readFile(config.FILES.friends);
  
  if (!friendsData[username]) {
    friendsData[username] = {
      friends: {},
      sharedListAccess: []
    };
    writeFile(config.FILES.friends, friendsData);
  }
  
  res.json(friendsData[username]);
});

router.post('/:username/add', (req, res) => {
  const { username } = req.params;
  const { friendUsername } = req.body;
  
  if (!friendUsername) {
    return res.status(400).json({ message: 'Username-ul prietenului este obligatoriu!' });
  }

  const friendsData = readFile(config.FILES.friends);
  
  // Initialize user data if doesn't exist
  if (!friendsData[username]) {
    friendsData[username] = {
      friends: {},
      sharedListAccess: []
    };
  }
  
  // Check if already friends
  if (friendsData[username].friends[friendUsername] !== undefined) {
    return res.status(400).json({ message: 'Utilizatorii sunt deja prieteni!' });
  }
  
  // Add friend with empty tags array
  friendsData[username].friends[friendUsername] = [];
  writeFile(config.FILES.friends, friendsData);
  
  res.json(friendsData[username]);
});

// Update friend tags
router.put('/:username/friends/:friendUsername/tags', (req, res) => {
  const { username, friendUsername } = req.params;
  const { tags } = req.body;
  
  const friendsData = readFile(config.FILES.friends);
  const availableTags = readFile(config.FILES.friendTags);
  
  // Validate tags
  if (tags) {
    const invalidTags = tags.filter(tag => !availableTags.includes(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({ 
        message: `Etichete invalide: ${invalidTags.join(', ')}` 
      });
    }
  }
  
  // Update tags
  friendsData[username].friends[friendUsername] = tags || [];
  writeFile(config.FILES.friends, friendsData);
  
  res.json(friendsData[username]);
});

// Update shared list access
router.post('/:username/share', (req, res) => {
  const { username } = req.params;
  const { selectedFriends } = req.body;
  
  if (!Array.isArray(selectedFriends)) {
    return res.status(400).json({ message: 'Lista de prieteni selectați este invalidă!' });
  }

  const friendsData = readFile(config.FILES.friends);
  
  // Validate that all selected friends are actually friends
  const invalidFriends = selectedFriends.filter(
    friend => !Object.keys(friendsData[username].friends).includes(friend)
  );
  
  if (invalidFriends.length > 0) {
    return res.status(400).json({ 
      message: `Următorii utilizatori nu sunt în lista de prieteni: ${invalidFriends.join(', ')}` 
    });
  }

  friendsData[username].sharedListAccess = selectedFriends;
  writeFile(config.FILES.friends, friendsData);
  
  res.json(friendsData[username]);
});

// Get filtered friends
router.get('/:username/filter', (req, res) => {
  const { username } = req.params;
  const { tags } = req.query; // tags va fi un array de tag-uri
  
  const friendsData = readFile(config.FILES.friends);
  const userData = friendsData[username];
  
  if (!userData) {
    return res.json({ friends: {} });
  }

  if (!tags || tags.length === 0) {
    return res.json({ friends: userData.friends });
  }

  // Convertim string-ul de tag-uri într-un array
  const tagArray = Array.isArray(tags) ? tags : tags.split(',');
  
  // Filtrăm prietenii care au toate tag-urile specificate
  const filteredFriends = Object.entries(userData.friends)
    .reduce((acc, [friend, friendTags]) => {
      if (tagArray.every(tag => friendTags.includes(tag))) {
        acc[friend] = friendTags;
      }
      return acc;
    }, {});

  res.json({ friends: filteredFriends });
});
module.exports = router;