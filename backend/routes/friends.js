const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('../utils/fileHelpers');
const config = require('../config/config');

// Get all friends and groups for a user
router.get('/:username', (req, res) => {
  const { username } = req.params;
  const friendsData = readFile(config.FILES.friends);
  
  if (!friendsData[username]) {
    friendsData[username] = {
      friends: [],
      groups: [],
      sharedListAccess: []
    };
    writeFile(config.FILES.friends, friendsData);
  }
  
  res.json(friendsData[username]);
});

// Add new friend
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
      friends: [],
      groups: [],
      sharedListAccess: []
    };
  }
  
  // Check if already friends
  if (friendsData[username].friends.includes(friendUsername)) {
    return res.status(400).json({ message: 'Utilizatorii sunt deja prieteni!' });
  }
  
  // Add friend
  friendsData[username].friends.push(friendUsername);
  writeFile(config.FILES.friends, friendsData);
  
  res.json(friendsData[username]);
});

// Create new group
router.post('/:username/groups', (req, res) => {
  const { username } = req.params;
  const { name, type, members } = req.body;
  
  if (!name || !type || !members) {
    return res.status(400).json({ 
      message: 'Numele grupului, tipul și membrii sunt obligatorii!' 
    });
  }

  const friendsData = readFile(config.FILES.friends);
  
  // Validate that all members are friends
  const invalidMembers = members.filter(
    member => !friendsData[username].friends.includes(member)
  );
  
  if (invalidMembers.length > 0) {
    return res.status(400).json({ 
      message: `Următorii utilizatori nu sunt în lista de prieteni: ${invalidMembers.join(', ')}` 
    });
  }

  const newGroup = { name, type, members };
  friendsData[username].groups.push(newGroup);
  writeFile(config.FILES.friends, friendsData);
  
  res.status(201).json(friendsData[username]);
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
    friend => !friendsData[username].friends.includes(friend)
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

// Get available products from friends that shared their list with the user
router.get('/:username/shared-products', (req, res) => {
  const { username } = req.params;
  const friendsData = readFile(config.FILES.friends);
  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  
  // Find all friends that shared their list with the current user
  const friendsSharedLists = Object.entries(friendsData)
    .filter(([friend, data]) => 
      friend !== username && data.sharedListAccess.includes(username)
    )
    .map(([friend]) => friend);
  
  // Get available products from these friends
  const sharedProducts = friendsSharedLists.reduce((acc, friend) => {
    if (foodsUnavailable[friend]) {
      acc[friend] = foodsUnavailable[friend];
    }
    return acc;
  }, {});
  
  res.json(sharedProducts);
});

module.exports = router;