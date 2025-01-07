import React, { useState, useEffect } from 'react';

function App() {
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFood, setEditFood] = useState({ 
    name: '', 
    expirationDate: '', 
    categories: [] 
  });

  useEffect(() => {
    // Load foods with error handling
    fetch('http://localhost:5000/foods')
      .then((res) => res.json())
      .then((data) => {
        // Ensure each food item has a categories array
        const sanitizedData = data.map(food => ({
          ...food,
          categories: Array.isArray(food.categories) ? food.categories : []
        }));
        setFoods(sanitizedData);
      })
      .catch((err) => console.error('Eroare la încărcarea alimentelor:', err));

    // Load categories
    fetch('http://localhost:5000/categories')
      .then((res) => res.json())
      .then((data) => setAvailableCategories(data))
      .catch((err) => console.error('Eroare la încărcarea categoriilor:', err));
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleEditCategoryChange = (category) => {
    setEditFood(prev => {
      const currentCategories = Array.isArray(prev.categories) ? prev.categories : [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const addFood = () => {
    if (!newFood || !expirationDate || selectedCategories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }

    fetch('http://localhost:5000/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newFood,
        expirationDate,
        categories: selectedCategories
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const sanitizedData = data.map(food => ({
          ...food,
          categories: Array.isArray(food.categories) ? food.categories : []
        }));
        setFoods(sanitizedData);
        setNewFood('');
        setExpirationDate('');
        setSelectedCategories([]);
      })
      .catch((err) => console.error('Eroare la adăugare:', err));
  };

  const deleteFood = (index) => {
    fetch(`http://localhost:5000/foods/${index}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => setFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };

  const editFoodItem = (index) => {
    if (!editFood.name || !editFood.expirationDate || editFood.categories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }

    fetch(`http://localhost:5000/foods/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFood),
    })
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setEditingIndex(null);
        setEditFood({ name: '', expirationDate: '', categories: [] });
      })
      .catch((err) => console.error('Eroare la editare:', err));
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
    const food = foods[index];
    setEditFood({
      name: food.name,
      expirationDate: food.expirationDate,
      categories: food.categories
    });
  };

  const CategoryCheckboxes = ({ selectedCategories, onChange }) => (
    <div className="categories-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0' }}>
      {availableCategories.map((category) => (
        <label key={category} style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
          <input
            type="checkbox"
            checked={selectedCategories.includes(category)}
            onChange={() => onChange(category)}
          />
          <span style={{ marginLeft: '5px' }}>{category}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Alimente</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Adaugă Aliment</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Nume Aliment"
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
          />
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          <div>
            <p>Selectați categoriile:</p>
            <CategoryCheckboxes
              selectedCategories={selectedCategories}
              onChange={handleCategoryChange}
            />
          </div>
          <button 
            onClick={addFood}
            style={{ padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Adaugă
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Aliment</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data Expirare</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Categorii</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food, index) => (
            <tr key={index}>
              {editingIndex === index ? (
                <>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <input
                      type="text"
                      value={editFood.name}
                      onChange={(e) => setEditFood({ ...editFood, name: e.target.value })}
                    />
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <input
                      type="date"
                      value={editFood.expirationDate}
                      onChange={(e) => setEditFood({ ...editFood, expirationDate: e.target.value })}
                    />
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <CategoryCheckboxes
                      selectedCategories={editFood.categories}
                      onChange={handleEditCategoryChange}
                    />
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button 
                      onClick={() => editFoodItem(index)}
                      style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Salvează
                    </button>
                    <button 
                      onClick={() => setEditingIndex(null)}
                      style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Anulează
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.expirationDate}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.categories.join(', ')}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button 
                      onClick={() => handleEditClick(index)}
                      style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Editează
                    </button>
                    <button 
                      onClick={() => deleteFood(index)}
                      style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Șterge
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;