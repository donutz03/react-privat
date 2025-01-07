import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import NotificationBell from './NotificationBell';


function App() {
  const [foods, setFoods] = useState([]);
  const [unavailableFoods, setUnavailableFoods] = useState([]);
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
  const today = new Date().toISOString().split('T')[0];

  
  // New state for authentication
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('currentUser'));
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Load available foods
      fetch(`http://localhost:5000/foods/${currentUser}`)
        .then((res) => res.json())
        .then((data) => {
          const sanitizedData = data.map(food => ({
            ...food,
            categories: Array.isArray(food.categories) ? food.categories : []
          }));
          setFoods(sanitizedData);
        })
        .catch((err) => console.error('Eroare la încărcarea alimentelor:', err));

      // Load unavailable foods
      fetch(`http://localhost:5000/foods-unavailable/${currentUser}`)
        .then((res) => res.json())
        .then((data) => {
          setUnavailableFoods(data);
        })
        .catch((err) => console.error('Eroare la încărcarea alimentelor indisponibile:', err));

      // Load categories
      fetch('http://localhost:5000/categories')
        .then((res) => res.json())
        .then((data) => setAvailableCategories(data))
        .catch((err) => console.error('Eroare la încărcarea categoriilor:', err));
    }
  }, [currentUser]);

  const preventDateTyping = (e) => {
    // Prevent any key input except Tab and Enter for navigation
    if (e.key !== 'Tab' && e.key !== 'Enter') {
      e.preventDefault();
    }
  };

  const handleMarkAvailability = (index, makeAvailable = true) => {
    fetch(`http://localhost:5000/foods/${currentUser}/toggle-availability/${index}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ makeAvailable })
    })
      .then((res) => res.json())
      .then((data) => {
        setFoods(data.available);
        setUnavailableFoods(data.unavailable);
      })
      .catch((err) => console.error('Eroare la modificarea disponibilității:', err));
  };

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

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setFoods([]);
  };

  const handleLogin = (username) => {
    setCurrentUser(username);
    setShowRegister(false);
  };

  // Rest of your existing functions, modified to include user information
  const addFood = () => {
    if (!newFood || !expirationDate || selectedCategories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }

    fetch(`http://localhost:5000/foods/${currentUser}`, {
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
    fetch(`http://localhost:5000/foods/${currentUser}/${index}`, {
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

    fetch(`http://localhost:5000/foods/${currentUser}/${index}`, {
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

  if (!currentUser) {
    return (
      <div>
        {showRegister ? (
          <>
            <Register onRegisterSuccess={() => setShowRegister(false)} />
            <button 
              onClick={() => setShowRegister(false)}
              style={{ 
                display: 'block', 
                margin: '0 auto', 
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Înapoi la autentificare
            </button>
          </>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <button 
              onClick={() => setShowRegister(true)}
              style={{ 
                display: 'block', 
                margin: '0 auto', 
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Creează cont nou
            </button>
          </>
        )}
      </div>
    );
  }

  const FoodTable = ({ foods, isAvailableTable = true }) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Prevent typing in date input
    const preventDateTyping = (e) => {
      if (e.key !== 'Tab' && e.key !== 'Enter') {
        e.preventDefault();
      }
    };
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
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
                      style={{ width: '100%', padding: '4px' }}
                    />
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={editFood.expirationDate}
                        min={today}
                        onChange={(e) => setEditFood({ ...editFood, expirationDate: e.target.value })}
                        onKeyDown={preventDateTyping}
                        style={{ 
                          width: '100%', 
                          padding: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666'
                      }}>
                        📅
                      </span>
                    </div>
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
                      onClick={() => {
                        setEditingIndex(null);
                        setEditFood({ name: '', expirationDate: '', categories: [] });
                      }}
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
                      style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Șterge
                    </button>
                    {isAvailableTable ? (
                      food.isNearExpiration && (
                        <button 
                          onClick={() => handleMarkAvailability(index, true)}
                          style={{ padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Marchează disponibil
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => handleMarkAvailability(index, false)}
                        style={{ padding: '4px 8px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Marchează indisponibil
                      </button>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (!currentUser) {
    return (
      <div>
        {showRegister ? (
          <>
            <Register onRegisterSuccess={() => setShowRegister(false)} />
            <button 
              onClick={() => setShowRegister(false)}
              style={{ 
                display: 'block', 
                margin: '0 auto', 
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Înapoi la autentificare
            </button>
          </>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <button 
              onClick={() => setShowRegister(true)}
              style={{ 
                display: 'block', 
                margin: '0 auto', 
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Creează cont nou
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Lista de Alimente - {currentUser}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell 
            foods={foods}
            onMarkAvailable={(index) => handleMarkAvailability(index, true)}
          />
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Deconectare
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
  <h2>Adaugă Aliment</h2>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
    <input
      type="text"
      placeholder="Nume Aliment"
      value={newFood}
      onChange={(e) => setNewFood(e.target.value)}
      style={{ padding: '8px' }}
    />
    <div style={{ position: 'relative' }}>
      <input
        type="date"
        value={expirationDate}
        min={today}
        onChange={(e) => setExpirationDate(e.target.value)}
        onKeyDown={preventDateTyping}
        style={{ 
          padding: '8px',
          width: '100%',
          cursor: 'pointer',
          backgroundColor: '#ffffff'
        }}
      />
      {/* Add a small calendar icon to make it clear this is calendar-only */}
      <span style={{ 
        position: 'absolute', 
        right: '10px', 
        top: '50%', 
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#666'
      }}>
        📅
      </span>
    </div>
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

      <div>
        <h2>Produse Disponibile</h2>
        <FoodTable foods={foods} isAvailableTable={true} />
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Produse Marcate ca Disponibile</h2>
        <FoodTable foods={unavailableFoods} isAvailableTable={false} />
      </div>
    </div>
  );
}

export default App;