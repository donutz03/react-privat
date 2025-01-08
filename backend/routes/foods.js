const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('../utils/fileHelpers');
const { isNearExpiration } = require('../utils/dateHelpers');
const config = require('../config/config');

router.get('/:username', (req, res) => {
  const { username } = req.params;
  const foods = readFile(config.FILES.foods);
  
  if (!foods[username]) {
    foods[username] = [];
    writeFile(config.FILES.foods, foods);
  }
  
  const foodsWithStatus = foods[username].map(food => ({
    ...food,
    isNearExpiration: isNearExpiration(food.expirationDate)
  }));
  
  res.json(foodsWithStatus);
});

router.post('/:username', (req, res) => {
  const { username } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ 
      message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' 
    });
  }

  const foods = readFile(config.FILES.foods);
  
  if (!foods[username]) {
    foods[username] = [];
  }
  
  foods[username].push({ name, expirationDate, categories });
  writeFile(config.FILES.foods, foods);
  
  const updatedFoods = foods[username].map(food => ({
    ...food,
    isNearExpiration: isNearExpiration(food.expirationDate)
  }));
  
  res.status(201).json(updatedFoods);
});

router.put('/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' });
  }

  const foods = readFile(config.FILES.foods);
  
  if (!foods[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foods[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foods[username][idx] = { name, expirationDate, categories };
  writeFile(config.FILES.foods, foods);
  
  res.json(foods[username]);
});

router.delete('/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const foods = readFile(config.FILES.foods);
  
  if (!foods[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foods[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foods[username].splice(idx, 1);
  writeFile(config.FILES.foods, foods);
  
  res.json(foods[username]);
});

router.post('/:username/toggle-availability/:index', (req, res) => {
  const { username, index } = req.params;
  const { makeAvailable } = req.body;
  
  const foods = readFile(config.FILES.foods);
  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  
  if (!foods[username]) foods[username] = [];
  if (!foodsUnavailable[username]) foodsUnavailable[username] = [];
  
  const idx = parseInt(index);
  let result = {};
  
  if (makeAvailable) {
    if (idx >= 0 && idx < foods[username].length) {
      const foodToMove = foods[username][idx];
      foods[username].splice(idx, 1);
      foodsUnavailable[username].push(foodToMove);
    }
  } else {
    if (idx >= 0 && idx < foodsUnavailable[username].length) {
      const foodToMove = foodsUnavailable[username][idx];
      foodsUnavailable[username].splice(idx, 1);
      foods[username].push(foodToMove);
    }
  }
  
  writeFile(config.FILES.foods, foods);
  writeFile(config.FILES.foodsUnavailable, foodsUnavailable);
  
  result = {
    available: foods[username].map(food => ({
      ...food,
      isNearExpiration: isNearExpiration(food.expirationDate)
    })),
    unavailable: foodsUnavailable[username]
  };
  
  res.json(result);
});

router.get('/unavailable/:username', (req, res) => {
  const { username } = req.params;
  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  
  if (!foodsUnavailable[username]) {
    foodsUnavailable[username] = [];
    writeFile(config.FILES.foodsUnavailable, foodsUnavailable);
  }
  
  res.json(foodsUnavailable[username]);
});

router.delete('/unavailable/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  
  if (!foodsUnavailable[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foodsUnavailable[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foodsUnavailable[username].splice(idx, 1);
  writeFile(config.FILES.foodsUnavailable, foodsUnavailable);
  
  res.json(foodsUnavailable[username]);
});

router.put('/unavailable/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' });
  }

  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  
  if (!foodsUnavailable[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foodsUnavailable[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foodsUnavailable[username][idx] = { name, expirationDate, categories };
  writeFile(config.FILES.foodsUnavailable, foodsUnavailable);
  
  res.json(foodsUnavailable[username]);
});

router.get('/expired/:username', (req, res) => {
  const { username } = req.params;
  const expiredProducts = readFile(config.FILES.expiredProducts);
  res.json(expiredProducts[username] || []);
});

router.delete('/expired/:username', (req, res) => {
  const { username } = req.params;
  const expiredProducts = readFile(config.FILES.expiredProducts);
  
  expiredProducts[username] = [];
  writeFile(config.FILES.expiredProducts, expiredProducts);
  
  res.json({ message: 'Produse expirate șterse cu succes!' });
});

module.exports = router;