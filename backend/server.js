const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = 5000;

app.use(bodyParser.json());

const foodsFilePath = './foods.txt';
const categoriesFilePath = './tipuriMancare.txt'
app.get('/categories', (req, res) => {
  fs.readFile(categoriesFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea categoriilor.');
    const categories = data ? JSON.parse(data) : [];
    res.json(categories);
  });
});
app.get('/foods', (req, res) => {
  fs.readFile(foodsFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea fișierului.');
    const foods = data ? JSON.parse(data) : [];
    res.json(foods);
  });
});

app.post('/foods', (req, res) => {
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).send('Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.');
  }

  fs.readFile(foodsFilePath, 'utf8', (err, data) => {
    let foods = data ? JSON.parse(data) : [];
    foods.push({ name, expirationDate, categories });

    fs.writeFile(foodsFilePath, JSON.stringify(foods, null, 2), (err) => {
      if (err) return res.status(500).send('Eroare la scrierea în fișier.');
      res.status(201).json(foods);
    });
  });
});

app.delete('/foods/:index', (req, res) => {
  const index = parseInt(req.params.index);

  fs.readFile(foodsFilePath, 'utf8', (err, data) => {
    let foods = data ? JSON.parse(data) : [];
    foods.splice(index, 1);

    fs.writeFile(foodsFilePath, JSON.stringify(foods, null, 2), (err) => {
      if (err) return res.status(500).send('Eroare la scrierea în fișier.');
      res.json(foods);
    });
  });
});

app.put('/foods/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const { name, expirationDate, categories } = req.body;

  if (!name || !expirationDate || !categories || categories.length === 0) {
    return res.status(400).send('Toate câmpurile sunt necesare și trebuie selectată cel puțin o categorie.');
  }

  fs.readFile(foodsFilePath, 'utf8', (err, data) => {
    let foods = data ? JSON.parse(data) : [];
    if (index < 0 || index >= foods.length) {
      return res.status(404).send('Index invalid.');
    }

    foods[index] = { name, expirationDate, categories };

    fs.writeFile(foodsFilePath, JSON.stringify(foods, null, 2), (err) => {
      if (err) return res.status(500).send('Eroare la scrierea în fișier.');
      res.json(foods);
    });
  });
});

app.listen(PORT, () => console.log(`Serverul rulează pe http://localhost:${PORT}`));