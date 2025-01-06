import React, { useState, useEffect } from 'react';

function App() {
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFood, setEditFood] = useState('');

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

   // Șterge un aliment
   const deleteFood = (index) => {
    fetch(`http://localhost:5000/foods/${index}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => setFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };

  // Editează un aliment
  const editFoodItem = (index) => {
    if (editFood.trim() === '') return;

    fetch(`http://localhost:5000/foods/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editFood }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setEditingIndex(null);
        setEditFood('');
      })
      .catch((err) => console.error('Eroare la editare:', err));
  };

// Precompletare input când editezi un aliment

const handleEditClick = (index) => {

  setEditingIndex(index);

  setEditFood(foods[index]); // Precompletăm cu numele existent

};

  return (
    <div>
      <h1>Lista de Alimente</h1>
      <ul>
        {foods.map((food, index) => (
           <li key={index}>

           {editingIndex === index ? (

             <>

               <input

                 type="text"

                 value={editFood}

                 onChange={(e) => setEditFood(e.target.value)}

               />

               <button onClick={() => editFoodItem(index)}>Salvează</button>

               <button onClick={() => setEditingIndex(null)}>Anulează</button>

             </>

           ) : (

             <>

               {food}

               <button onClick={() => handleEditClick(index)}>Edit</button>

               <button onClick={() => deleteFood(index)}>Delete</button>
             </>
           )}
         </li>
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
