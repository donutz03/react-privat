const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth');
const foodsRoutes = require('./routes/foods');
const categoriesRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/foods', foodsRoutes);
app.use('/categories', categoriesRoutes);

app.listen(config.PORT, () => console.log(`Serverul rulează pe http://localhost:${config.PORT}`));