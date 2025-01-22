const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config/config');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const foodsRoutes = require('./routes/foods');
const categoriesRoutes = require('./routes/categories');
const friendsRoutes = require('./routes/friends');  // New import

const app = express();

// Middleware
app.use(cors());
app.use('/foods/image', cors({
    origin: 'http://localhost:3000',
    methods: ['GET'],
    maxAge: 86400
}));
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/foods', foodsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/friends', friendsRoutes);

app.use(express.static(path.join(__dirname, 'food-list-app/build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'food-list-app/build', 'index.html'));
});

app.listen(config.PORT, () => console.log(`Serverul rulează pe http://localhost:${config.PORT}`));