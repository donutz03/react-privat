const { Pool } = require('pg');
require('dotenv').config();

const useLocalDB = !process.env.DYNO; // DYNO este setat automat de Heroku

const pool = useLocalDB ? new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}) : new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Pentru debug
console.log('Database connection mode:', useLocalDB ? 'Local' : 'Heroku');

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};