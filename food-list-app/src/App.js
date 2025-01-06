import React, { useState, useEffect } from 'react';

function App() {
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState('');

  // Fetch lista de alimente de la backend
  useEffect(() => {
    fetch('http://localhost:5000/foods')
      .then((res) => res.json())
      .then((data) => setFoods(data))
      .catch((err) => console.error('Eroare la fetch:', err));
  }, []);

  // Adaugă un aliment nou
  const addFood = () => {
    if (newFood.trim() === '') return;

    fetch('http://localhost:5000/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFood }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setNewFood('');
      })
      .catch((err) => console.error('Eroare la adăugare:', err));
  };

  return (
    <div>
      <h1>Lista de Alimente</h1>
      <ul>
        {foods.map((food, index) => (
          <li key={index}>{food}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newFood}
        onChange={(e) => setNewFood(e.target.value)}
      />
      <button onClick={addFood}>Adaugă</button>
    </div>
  );
}

export default App;
