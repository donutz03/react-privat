import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import NotificationBell from './NotificationBell';
import ExpiredProductsTable from './ExpiredProductsTable';
import FoodTable from './FoodTable';
import CategoryCheckboxes from './CategoryCheckboxes';
import FriendsManager from './components/FriendsManager';
import SharedProducts from './components/SharedProducts';

function App() {
  const [showSharedProducts, setShowSharedProducts] = useState(false);
  const [currentView, setCurrentView] = useState('products'); // poate fi 'products', 'friends' sau 'shared'
  const [personalFoods, setPersonalFoods] = useState([]);
  const [sharedFoods, setSharedFoods] = useState([]);
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
  const [showFriendsManager, setShowFriendsManager] = useState(false);
  const today = new Date().toISOString().split('T')[0];


  
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
        setPersonalFoods(sanitizedData);
      })
      .catch((err) => console.error('Eroare la încărcarea alimentelor:', err));
  
    // Load unavailable foods - FIXED URL
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}`)
      .then((res) => res.json())
      .then((data) => {
        setSharedFoods(data);
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
        setPersonalFoods(data.available);
        setSharedFoods(data.unavailable);
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
    setPersonalFoods([]);
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
        setPersonalFoods(sanitizedData);
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
      .then((data) => setPersonalFoods(data))
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
        setPersonalFoods(data);
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
      .then((data) => setSharedFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };
  
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
        setSharedFoods(data);
        setAvailableEditingIndex(null);  // Corectare aici - folosim indexul corect
        setEditFood({ name: '', expirationDate: '', categories: [] });
      })
      .catch((err) => console.error('Eroare la editare:', err));
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
            foods={personalFoods}
            onMarkAvailable={(index) => handleMarkAvailability(index, true)}
          />
          <button 
    onClick={() => {
      setShowFriendsManager(false);
      setShowSharedProducts(true);
    }}
    style={{ 
      padding: '8px 16px', 
      backgroundColor: showSharedProducts ? '#2196F3' : '#90caf9', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer' 
    }}
  >
    Produse de la Prieteni
  </button>
  <button 
    onClick={() => {
      setShowFriendsManager(!showFriendsManager);
      setShowSharedProducts(false);
    }}
    style={{ 
      padding: '8px 16px', 
      backgroundColor: showFriendsManager ? '#2196F3' : '#90caf9', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer' 
    }}
  >
    {showFriendsManager ? 'Înapoi la Produse' : 'Gestionare Prieteni'}
  </button>
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
     
      {showFriendsManager ? (
        <FriendsManager currentUser={currentUser} />
      ) : showSharedProducts ? (
        <SharedProducts currentUser={currentUser} setShowSharedProducts={setShowSharedProducts}/>
      ) : ( <>
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
            min={today}
            value={expirationDate}
            onKeyDown={preventDateTyping}
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
    availableCategories={availableCategories}
    foods={personalFoods} 
    isAvailableTable={true}
    onDelete={deleteFood}
    editingIndex={unavailableEditingIndex}
    setUnavailableEditingIndex={setUnavailableEditingIndex}
    setAvailableEditingIndex={setAvailableEditingIndex} // Adăugăm și celălalt setter
    editFood={editFood}
    setEditFood={setEditFood}
    onEditSave={editFoodItem}
    onEditClick={(index, food) => {
      setUnavailableEditingIndex(index);
      setAvailableEditingIndex(null); // Resetăm celălalt index
      setEditFood({
        name: food.name,
        expirationDate: food.expirationDate,
        categories: food.categories
      });
    }}
    handleEditCategoryChange={handleEditCategoryChange}
    handleMarkAvailability={handleMarkAvailability}
  />
</div>


<div style={{ marginTop: '40px' }}>
  <h2>Produse Marcate ca Disponibile</h2>
  <FoodTable 
    availableCategories={availableCategories}
    foods={sharedFoods} 
    isAvailableTable={false}
    onDelete={deleteUnavailableFood}
    editingIndex={availableEditingIndex}
    setUnavailableEditingIndex={setUnavailableEditingIndex}
    setAvailableEditingIndex={setAvailableEditingIndex} // Adăugăm ambii setteri
    editFood={editFood}
    setEditFood={setEditFood}
    onEditSave={editUnavailableFoodItem}
    onEditClick={(index, food) => {
      setAvailableEditingIndex(index);
      setUnavailableEditingIndex(null); // Resetăm celălalt index
      setEditFood({
        name: food.name,
        expirationDate: food.expirationDate,
        categories: food.categories
      });
    }}
    handleEditCategoryChange={handleEditCategoryChange}
    handleMarkAvailability={handleMarkAvailability}
  />
</div>
<div style={{ marginTop: '40px' }}>
        <ExpiredProductsTable foods={expiredFoods} currentUser={currentUser} setExpiredFoods={setExpiredFoods}/>
      </div>
      </>
        )}
    </div>
  );
}

export default App;