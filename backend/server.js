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

  res.json({ message: 'Autentificare reușită!' });
});

app.get('/categories', (req, res) => {
  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea categoriilor.');
    const categories = data ? JSON.parse(data) : [];
    res.json(categories);
  });
});
app.get('/foods/:username', (req, res) => {
  const { username } = req.params;
  const foods = readFile(foodsFilePath);
  
  // If user exists but has no foods yet, initialize empty array
  if (!foods[username]) {
    foods[username] = [];
    writeFile(foodsFilePath, foods);
  }
  
  res.json(foods[username] || []);
});
app.post('/foods/:username', (req, res) => {
  const { username } = req.params;
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).json({ message: 'Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.' });
  }

  const foods = readFile(foodsFilePath);
  
  // Initialize user's foods array if it doesn't exist
  if (!foods[username]) {
    foods[username] = [];
  }
  
  // Add new food to user's array
  foods[username].push({ name, expirationDate, categories });
  writeFile(foodsFilePath, foods);
  
  res.status(201).json(foods[username]);
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