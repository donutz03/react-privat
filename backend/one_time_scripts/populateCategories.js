const db = require('./database/db');
const fs = require('fs');
const path = require('path');

async function populateCategories() {
    try {
        // Citim datele din fișierul tipuriMancare.txt
        const categoriesData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'tipuriMancare.txt'), 'utf8')
        );

        console.log('Categorii găsite:', categoriesData);

        // Inserăm fiecare categorie
        for (const category of categoriesData) {
            await db.query(
                'INSERT INTO food_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [category]
            );
            console.log(`Categorie inserată: ${category}`);
        }

        console.log('Populare categorii completă!');
        
        // Verificăm categoriile inserate
        const result = await db.query('SELECT * FROM food_categories');
        console.log('Categorii în baza de date:', result.rows);

        process.exit();
    } catch (error) {
        console.error('Eroare la popularea categoriilor:', error);
        process.exit(1);
    }
}

populateCategories();