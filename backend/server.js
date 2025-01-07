const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = 5000;

app.use(bodyParser.json());

const foodsFilePath = './foods.txt';
const usersFilePath = './users.txt';
const categoriesFilePath = './tipuriMancare.txt'
const foodsUnavailableFilePath = './foodsUnavailable.txt';
const expiredProductsFilePath = './produseExpirate.txt';

const isExpired = (expirationDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  const expDate = new Date(expirationDate);
  return expDate < today;
};

const isNearExpiration = (expirationDate) => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
};

const readFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
};

const writeFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const moveExpiredProducts = (username) => {
  const foods = readFile(foodsFilePath);
  const foodsUnavailable = readFile(foodsUnavailableFilePath);
  const expiredProducts = readFile(expiredProductsFilePath);

  if (!expiredProducts[username]) {
    expiredProducts[username] = [];
  }

  // Check foods.txt for expired products
  if (foods[username]) {
    const [expired, valid] = foods[username].reduce(([exp, val], food) => {
      return isExpired(food.expirationDate) 
        ? [[...exp, food], val]
        : [exp, [...val, food]];
    }, [[], []]);
    
    foods[username] = valid;
    expiredProducts[username].push(...expired);
  }

  // Check foodsUnavailable.txt for expired products
  if (foodsUnavailable[username]) {
    const [expired, valid] = foodsUnavailable[username].reduce(([exp, val], food) => {
      return isExpired(food.expirationDate)
        ? [[...exp, food], val]
        : [exp, [...val, food]];
    }, [[], []]);
    
    foodsUnavailable[username] = valid;
    expiredProducts[username].push(...expired);
  }

  // Save all changes
  writeFile(foodsFilePath, foods);
  writeFile(foodsUnavailableFilePath, foodsUnavailable);
  writeFile(expiredProductsFilePath, expiredProducts);

  return {
    available: foods[username] || [],
    unavailable: foodsUnavailable[username] || [],
    expired: expiredProducts[username] || []
  };
};

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  const users = readFile(usersFilePath);
  
  if (users[username]) {
    return res.status(400).json({ message: 'Utilizatorul există deja!' });
  }

  users[username] = { password };
  writeFile(usersFilePath, users);

  // Initialize empty foods array for new user
  const foods = readFile(foodsFilePath);
  foods[username] = [];
  writeFile(foodsFilePath, foods);

  res.status(201).json({ message: 'Cont creat cu succes!' });
});
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii!' });
  }

  const users = readFile(usersFilePath);
  
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: 'Credențiale invalide!' });
  }

  // Move expired products upon login
  const products = moveExpiredProducts(username);

  res.json({ 
    message: 'Autentificare reușită!',
    products
  });
});

app.get('/foods-expired/:username', (req, res) => {
  const { username } = req.params;
  const expiredProducts = readFile(expiredProductsFilePath);
  res.json(expiredProducts[username] || []);
});

// Add endpoint to delete all expired products for a user
app.delete('/foods-expired/:username', (req, res) => {
  const { username } = req.params;
  const expiredProducts = readFile(expiredProductsFilePath);
  
  expiredProducts[username] = [];
  writeFile(expiredProductsFilePath, expiredProducts);
  
  res.json({ message: 'Produse expirate șterse cu succes!' });
});

app.get('/categories', (req, res) => {
  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea categoriilor.');
    const categories = data ? JSON.parse(data) : [];
    res.json(categories);
  });
});
// Modified /foods/:username GET route to include expiration status
app.get('/foods/:username', (req, res) => {
  const { username } = req.params;
  const foods = readFile(foodsFilePath);
  
  if (!foods[username]) {
    foods[username] = [];
    writeFile(foodsFilePath, foods);
  }
  
  // Add isNearExpiration flag to each food item
  const foodsWithStatus = foods[username].map(food => ({
    ...food,
    isNearExpiration: isNearExpiration(food.expirationDate)
  }));
  
  res.json(foodsWithStatus);
});

app.get('/foods-unavailable/:username', (req, res) => {
  const { username } = req.params;
  const foodsUnavailable = readFile(foodsUnavailableFilePath);
  
  if (!foodsUnavailable[username]) {
    foodsUnavailable[username] = [];
    writeFile(foodsUnavailableFilePath, foodsUnavailable);
  }
  
  res.json(foodsUnavailable[username]);
});

// Adăugăm noi endpoint-uri pentru produsele indisponibile
app.delete('/foods-unavailable/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const foodsUnavailable = readFile(foodsUnavailableFilePath);
  
  if (!foodsUnavailable[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foodsUnavailable[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foodsUnavailable[username].splice(idx, 1);
  writeFile(foodsUnavailableFilePath, foodsUnavailable);
  
  res.json(foodsUnavailable[username]);
});

app.put('/foods-unavailable/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' });
  }

  const foodsUnavailable = readFile(foodsUnavailableFilePath);
  
  if (!foodsUnavailable[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foodsUnavailable[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foodsUnavailable[username][idx] = { name, expirationDate, categories };
  writeFile(foodsUnavailableFilePath, foodsUnavailable);
  
  res.json(foodsUnavailable[username]);
});

app.post('/foods/:username', (req, res) => {
  const { username } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ 
      message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' 
    });
  }

  const foods = readFile(foodsFilePath);
  
  // Initialize user's foods array if it doesn't exist
  if (!foods[username]) {
    foods[username] = [];
  }
  
  // Add new food to user's array
  foods[username].push({ name, expirationDate, categories });
  writeFile(foodsFilePath, foods);
  
  // Return the updated list with expiration status
  const updatedFoods = foods[username].map(food => ({
    ...food,
    isNearExpiration: isNearExpiration(food.expirationDate)
  }));
  
  res.status(201).json(updatedFoods);
});

app.post('/foods/:username/toggle-availability/:index', (req, res) => {
  const { username, index } = req.params;
  const { makeAvailable } = req.body; // true to mark as available, false to mark as unavailable
  
  const foods = readFile(foodsFilePath);
  const foodsUnavailable = readFile(foodsUnavailableFilePath);
  
  if (!foods[username]) foods[username] = [];
  if (!foodsUnavailable[username]) foodsUnavailable[username] = [];
  
  const idx = parseInt(index);
  let result = {};
  
  if (makeAvailable) {
    // Move from foods to foodsUnavailable
    if (idx >= 0 && idx < foods[username].length) {
      const foodToMove = foods[username][idx];
      foods[username].splice(idx, 1);
      foodsUnavailable[username].push(foodToMove);
    }
  } else {
    // Move from foodsUnavailable back to foods
    if (idx >= 0 && idx < foodsUnavailable[username].length) {
      const foodToMove = foodsUnavailable[username][idx];
      foodsUnavailable[username].splice(idx, 1);
      foods[username].push(foodToMove);
    }
  }
  
  writeFile(foodsFilePath, foods);
  writeFile(foodsUnavailableFilePath, foodsUnavailable);
  
  result = {
    available: foods[username].map(food => ({
      ...food,
      isNearExpiration: isNearExpiration(food.expirationDate)
    })),
    unavailable: foodsUnavailable[username]
  };
  
  res.json(result);
});


app.delete('/foods/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const foods = readFile(foodsFilePath);
  
  if (!foods[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foods[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foods[username].splice(idx, 1);
  writeFile(foodsFilePath, foods);
  
  res.json(foods[username]);
});

app.put('/foods/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' });
  }

  const foods = readFile(foodsFilePath);
  
  if (!foods[username]) {
    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
  }
  
  const idx = parseInt(index);
  if (idx < 0 || idx >= foods[username].length) {
    return res.status(404).json({ message: 'Index invalid.' });
  }
  
  foods[username][idx] = { name, expirationDate, categories };
  writeFile(foodsFilePath, foods);
  
  res.json(foods[username]);
});

app.listen(PORT, () => console.log(`Serverul rulează pe http://localhost:${PORT}`));