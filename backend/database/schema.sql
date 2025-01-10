-- Tabela pentru utilizatori
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela pentru categorii de alimente
CREATE TABLE food_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabela pentru alimente
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT false,
    is_expired BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de legătură între alimente și categorii (many-to-many)
CREATE TABLE food_category_relations (
    food_id INTEGER REFERENCES foods(id),
    category_id INTEGER REFERENCES food_categories(id),
    PRIMARY KEY (food_id, category_id)
);

-- Tabela pentru taguri de prieteni
CREATE TABLE friend_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabela pentru relații de prietenie și taguri
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Tabela pentru tagurile aplicate prietenilor
CREATE TABLE friendship_tags (
    friendship_id INTEGER REFERENCES friendships(id),
    tag_id INTEGER REFERENCES friend_tags(id),
    PRIMARY KEY (friendship_id, tag_id)
);

-- Tabela pentru grupuri
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela pentru membrii grupurilor
CREATE TABLE group_members (
    group_id INTEGER REFERENCES groups(id),
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (group_id, user_id)
);

-- Tabela pentru permisiuni de vizualizare a listelor
CREATE TABLE shared_list_access (
    user_id INTEGER REFERENCES users(id),
    viewer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, viewer_id)
);

ALTER TABLE foods ADD COLUMN claim_status VARCHAR(50) DEFAULT 'unclaimed';

-- Create a table to track claimed products
CREATE TABLE claimed_products (
    id SERIAL PRIMARY KEY,
    food_id INTEGER REFERENCES foods(id),
    claimed_by INTEGER REFERENCES users(id),
    original_owner INTEGER REFERENCES users(id),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE foods ADD COLUMN is_claimed_product BOOLEAN DEFAULT false;
