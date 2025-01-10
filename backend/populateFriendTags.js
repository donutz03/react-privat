const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Creăm conexiunea la baza de date
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function populateFriendTags() {
    try {
        // Citim datele din fișierul tipuriPrieteni.txt folosind calea corectă
        const tagsData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'tipuriPrieteni.txt'), 'utf8')
        );

        console.log('Taguri găsite:', tagsData);

        // Inserăm fiecare tag
        for (const tag of tagsData) {
            await pool.query(
                'INSERT INTO friend_tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [tag]
            );
            console.log(`Tag inserat: ${tag}`);
        }

        console.log('Populare taguri completă!');
        
        // Verificăm tagurile inserate
        const result = await pool.query('SELECT * FROM friend_tags ORDER BY name');
        console.log('Taguri în baza de date:', result.rows);

        await pool.end(); // Închidem conexiunea la pool
        process.exit();
    } catch (error) {
        console.error('Eroare la popularea tagurilor:', error);
        await pool.end(); // Închidem conexiunea la pool și în caz de eroare
        process.exit(1);
    }
}

populateFriendTags();