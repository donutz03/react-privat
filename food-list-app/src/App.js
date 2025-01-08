import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import NotificationBell from './NotificationBell';
import ExpiredProductsTable from './ExpiredProductsTable';
import FoodTable from './FoodTable';
import CategoryCheckboxes from './CategoryCheckboxes';


function App() {
  const [foods, setFoods] = useState([]);
  const [unavailableFoods, setUnavailableFoods] = useState([]);
  const [expiredFoods, setExpiredFoods] = useState([]);
  const [newFood, setNewFood] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [unavailableEditingIndex, setUnavailableEditingIndex] = useState(null);
  const[availableEditingIndex, setAvailableEditingIndex]=useState(null);
  const [editFood, setEditFood] = useState({ 
    name: '', 
    expirationDate: '', 
    categories: [] 
  });

  
  // New state for authentication
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('currentUser'));
  const [showRegister, setShowRegister] = useState(false);
  useEffect(() => {
    if (currentUser) {
      // Load all types of foods after login
      loadAllFoods();
    }
  }, [currentUser]);

  const loadAllFoods = () => {
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
  
    // Load unavailable foods - FIXED URL
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}`)
      .then((res) => res.json())
      .then((data) => {
        setUnavailableFoods(data);
      })
      .catch((err) => console.error('Eroare la încărcarea alimentelor indisponibile:', err));
  
    // Load expired foods - FIXED URL
    fetch(`http://localhost:5000/foods/expired/${currentUser}`)
      .then((res) => res.json())
      .then((data) => {
        setExpiredFoods(data);
      })
      .catch((err) => console.error('Eroare la încărcarea alimentelor expirate:', err));
  
    fetch('http://localhost:5000/categories')
      .then((res) => res.json())
      .then((data) => setAvailableCategories(data))
      .catch((err) => console.error('Eroare la încărcarea categoriilor:', err));
  };

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
    loadAllFoods();
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
        setUnavailableEditingIndex(null);
        setEditFood({ name: '', expirationDate: '', categories: [] });
      })
      .catch((err) => console.error('Eroare la editare:', err));
  };

  const deleteUnavailableFood = (index) => {
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}/${index}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => setUnavailableFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };
  
  // Update editUnavailableFoodItem function
  const editUnavailableFoodItem = (index) => {
    if (!editFood.name || !editFood.expirationDate || editFood.categories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }
  
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}/${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFood),
    })
      .then((res) => res.json())
      .then((data) => {
        setUnavailableFoods(data);
        setUnavailableEditingIndex(null);
        setEditFood({ name: '', expirationDate: '', categories: [] });
      })
      .catch((err) => console.error('Eroare la editare:', err));
  };
  
  // Update ExpiredProductsTable's delete function
  const handleDeleteExpiredProducts = () => {
    fetch(`http://localhost:5000/foods/expired/${currentUser}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        setExpiredFoods([]); // Clear expired foods from state
      })
      .catch((err) => console.error('Eroare la ștergerea produselor expirate:', err));
  };

  const handleEditClick = (index) => {
    setUnavailableEditingIndex(index);
    const food = foods[index];
    setEditFood({
      name: food.name,
      expirationDate: food.expirationDate,
      categories: food.categories
    });
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
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            style={{ padding: '8px' }}
          />
          <div>
            <p>Selectați categoriile:</p>
            <CategoryCheckboxes
              selectedCategories={selectedCategories}
              onChange={handleCategoryChange}
              availableCategories={availableCategories}
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
  <h2>Produsele mele</h2>
  <FoodTable 
  setUnavailableEditingIndex={setUnavailableEditingIndex}
  availableCategories={availableCategories}
    foods={foods} 
    isAvailableTable={true}
    onDelete={deleteFood}
    editingIndex={unavailableEditingIndex}
    editFood={editFood}
    setEditFood={setEditFood}
    onEditSave={editFoodItem}
    onEditClick={(index, food) => {
      setUnavailableEditingIndex(index);
      setEditFood({
        name: food.name,
        expirationDate: food.expirationDate,
        categories: food.categories
      });
    }}
    handleEditCategoryChange={handleEditCategoryChange}
  />
</div>

<div style={{ marginTop: '40px' }}>
  <h2>Produse Marcate ca Disponibile</h2>
  <FoodTable 
    availableCategories={availableCategories}
    setUnavailableEditingIndex={setUnavailableEditingIndex}
    foods={unavailableFoods} 
    isAvailableTable={false}
    onDelete={deleteUnavailableFood}
    editingIndex={availableEditingIndex}
    editFood={editFood}
    setEditFood={setEditFood}
    onEditSave={editUnavailableFoodItem}
    onEditClick={(index, food) => {
      setAvailableEditingIndex(index);
      setEditFood({
        name: food.name,
        expirationDate: food.expirationDate,
        categories: food.categories
      });
    }}
    handleEditCategoryChange={handleEditCategoryChange}
  />
</div>

<div style={{ marginTop: '40px' }}>
        <ExpiredProductsTable foods={expiredFoods} currentUser={currentUser} setExpiredFoods={setExpiredFoods}/>
      </div>
    </div>
  );
}

export default App;