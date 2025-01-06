const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
const PORT = 5000;

app.use(bodyParser.json());

const filePath = './foods.txt';

app.get('/foods', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Eroare la citirea fișierului.');
    const foods = data ? JSON.parse(data) : [];
    res.json(foods);
  });
});

app.post('/foods', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Numele alimentului este necesar.');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let foods = data ? JSON.parse(data) : [];
    foods.push(name);

    fs.writeFile(filePath, JSON.stringify(foods), (err) => {
      if (err) return res.status(500).send('Eroare la scrierea în fișier.');
      res.status(201).json(foods);
    });
  });
});

app.listen(PORT, () => console.log(`Serverul rulează pe http://localhost:${PORT}`));
