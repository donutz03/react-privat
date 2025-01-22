// Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ExpiredProductsTable from './ExpiredProductsTable';
import FoodTable from './FoodTable';
import CategoryCheckboxes from './CategoryCheckboxes';

function Dashboard() {
  const navigate = useNavigate();
  
  // States moved from App.js
  const [personalFoods, setPersonalFoods] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sharedFoods, setSharedFoods] = useState([]);
  const [expiredFoods, setExpiredFoods] = useState([]);
  const [newFood, setNewFood] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [availableEditingId, setAvailableEditingId] = useState(null);
  const [editFood, setEditFood] = useState({
    image: '',
    name: '',
    expirationDate: '',
    categories: []
  });

  // Constants and utilities
  const currentUser = localStorage.getItem('currentUser');
  const today = new Date().toISOString().split('T')[0];

  // Handle image changes for editing
  const handleImageChange = (file) => {
    setEditFood(prev => ({ ...prev, image: file }));
  };

  // Load all foods data
  const loadAllFoods = useCallback(async () => {
    try {
      // Load available foods
      const availableResponse = await fetch(`http://localhost:5000/foods/${currentUser}`);
      if (!availableResponse.ok) {
        throw new Error('Eroare la încărcarea produselor disponibile');
      }
      const availableData = await availableResponse.json();
      setPersonalFoods(Array.isArray(availableData) ? availableData : []);

      // Load unavailable foods
      const unavailableResponse = await fetch(`http://localhost:5000/foods/unavailable/${currentUser}`);
      if (!unavailableResponse.ok) {
        throw new Error('Eroare la încărcarea produselor indisponibile');
      }
      const unavailableData = await unavailableResponse.json();
      setSharedFoods(Array.isArray(unavailableData) ? unavailableData : []);

      // Load expired foods
      const expiredResponse = await fetch(`http://localhost:5000/foods/expired/${currentUser}`);
      if (!expiredResponse.ok) {
        throw new Error('Eroare la încărcarea produselor expirate');
      }
      const expiredData = await expiredResponse.json();
      setExpiredFoods(Array.isArray(expiredData) ? expiredData : []);

      // Load categories
      const categoriesResponse = await fetch('http://localhost:5000/categories');
      if (!categoriesResponse.ok) {
        throw new Error('Eroare la încărcarea categoriilor');
      }
      const categoriesData = await categoriesResponse.json();
      setAvailableCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Eroare la încărcarea datelor:', error);
    }
  }, [currentUser]);

  // Check for expired products
  const checkExpiredProducts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`http://localhost:5000/foods/check-expired/${currentUser}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Eroare la verificarea produselor expirate');
      }
      
      loadAllFoods();
    } catch (error) {
      console.error('Eroare la verificarea produselor expirate:', error);
    }
  }, [currentUser, loadAllFoods]);

  // Initial load effect
  useEffect(() => {
    if (currentUser) {
      checkExpiredProducts();
    } else {
      navigate('/login');
    }
  }, [currentUser, checkExpiredProducts, navigate]);

  // Utility functions
  const preventDateTyping = (e) => {
    if (e.key !== 'Tab' && e.key !== 'Enter') {
      e.preventDefault();
    }
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

  // Navigation handlers
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // Add food functionality
  const addFood = () => {
    // Validation check
    if (!newFood || !expirationDate || selectedCategories.length === 0 || !selectedImage) {      
        alert('Vă rugăm completați toate câmpurile obligatorii!');
      return;
    }
  
    // Create FormData object for handling file upload
    const formData = new FormData();
    formData.append('name', newFood);
    formData.append('expirationDate', expirationDate);
    formData.append('categories', JSON.stringify(selectedCategories));
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
  
    // Send POST request to add food
    fetch(`http://localhost:5000/foods/${currentUser}`, {
      method: 'POST',
      body: formData
    })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setPersonalFoods(data);
        // Reset form
        setNewFood('');
        setExpirationDate('');
        setSelectedCategories([]);
        setSelectedImage(null);
      } else {
        console.error('Received non-array response:', data);
        setPersonalFoods([]);
      }
    })
    .catch((err) => {
      console.error('Eroare la adăugare:', err);
      setPersonalFoods([]);
    });
  };

  // Delete food functionality
  const deleteFood = (foodId) => {
    fetch(`http://localhost:5000/foods/${currentUser}/${foodId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => setPersonalFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };

  // Edit food functionality
  const editFoodItem = (foodId) => {
    if (!editFood.name || !editFood.expirationDate || editFood.categories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }
  
    const formData = new FormData();
    formData.append('name', editFood.name);
    formData.append('expirationDate', editFood.expirationDate);
    formData.append('categories', JSON.stringify(editFood.categories));
    
    if (editFood.image) {
      formData.append('image', editFood.image);
    }

    fetch(`http://localhost:5000/foods/${currentUser}/${foodId}`, {
      method: 'PUT',
      body: formData,
    })
        .then((res) => res.json())
        .then((data) => {
          // Update food list with the new data
          setPersonalFoods(data.map((food) => ({
            ...food,
            imageUrl: `${food.imageUrl}?t=${new Date().getTime()}`, // Add cache-busting query string
          })));
          setEditingFoodId(null);
          setEditFood({ name: '', expirationDate: '', categories: [], image: null });
        })
        .catch((err) => console.error('Eroare la editare:', err));
  };

  // Functions for handling unavailable foods
  const deleteUnavailableFood = (foodId) => {
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}/${foodId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data) => setSharedFoods(data))
      .catch((err) => console.error('Eroare la ștergere:', err));
  };

  const editUnavailableFoodItem = (foodId) => {
    if (!editFood.name || !editFood.expirationDate || editFood.categories.length === 0) {
      alert('Vă rugăm completați toate câmpurile și selectați cel puțin o categorie!');
      return;
    }
  
    const formData = new FormData();
    formData.append('name', editFood.name);
    formData.append('expirationDate', editFood.expirationDate);
    formData.append('categories', JSON.stringify(editFood.categories));
    
    if (editFood.image) {
      formData.append('image', editFood.image);
    }
  
    fetch(`http://localhost:5000/foods/unavailable/${currentUser}/${foodId}`, {
      method: 'PUT',
      body: formData
    })
      .then((res) => res.json())
      .then((data) => {
        setSharedFoods(data);
        setAvailableEditingId(null);
        setEditFood({ name: '', expirationDate: '', categories: [], image: null });
      })
      .catch((err) => console.error('Eroare la editare:', err));
  };

  // Toggle food availability
  const handleMarkAvailability = (foodId, makeAvailable = true) => {
    fetch(`http://localhost:5000/foods/${currentUser}/toggle-availability/${foodId}`, {
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

  // Main render method
  return (
    <div style={{ padding: '20px'}}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Lista de Alimente - {currentUser}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell 
            foods={personalFoods}
            onMarkAvailable={(index) => handleMarkAvailability(index, true)}
          />
          <button 
            onClick={() => navigate('/shared-products')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#90caf9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Produse de la Prieteni
          </button>
          <button 
            onClick={() => navigate('/friends')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#90caf9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Gestionare Prieteni
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

      {/* Add Food Section */}
      <div style={{display:'flex'}} >
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

            {/* Image Upload Section */}
            <div style={{
              marginTop: '10px',
              border: '2px dashed #ccc',
              padding: '20px',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="food-image"
              />
              <label
                  htmlFor="food-image"
                  style={{
                    cursor: 'pointer',
                    display: 'block'
                  }}
              >
                {selectedImage ? (
                    <div>
                      <img
                          src={URL.createObjectURL(selectedImage)}
                          alt="Preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            margin: '10px auto'
                          }}
                      />
                      <p>Click pentru a schimba imaginea</p>
                    </div>
                ) : (
                    <div>
                      <p>Click pentru a adăuga o imagine</p>
                    </div>
                )}
              </label>
            </div>

            <button
                onClick={addFood}
                style={{ padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Adaugă
            </button>
          </div>

        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img
              src="home-img.jpg"
              width={400}
              style={{ display: 'block', margin: '0 auto',borderRadius:'100%' }}
              className="rotating-image"
          />
        </div>

        </div>


      {/* Personal Foods Table */}
      <div>
        <h2>Produsele mele</h2>
        <FoodTable 
          availableCategories={availableCategories}
          foods={personalFoods} 
          isAvailableTable={true}
          onDelete={deleteFood}
          editingId={editingFoodId}
          setEditingId={setEditingFoodId}
          editFood={editFood}
          setEditFood={setEditFood}
          onEditSave={editFoodItem}
          handleImageChange={handleImageChange}
          onEditClick={(id, food) => {
            setEditingFoodId(id);
            setAvailableEditingId(null);
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

      {/* Shared Foods Table */}
      <div style={{ marginTop: '40px' }}>
        <h2>Produse Marcate ca Disponibile</h2>
        <FoodTable 
          availableCategories={availableCategories}
          foods={sharedFoods} 
          isAvailableTable={false}
          onDelete={deleteUnavailableFood}
          editingId={availableEditingId}
          setEditingId={setAvailableEditingId}
          editFood={editFood}
          setEditFood={setEditFood}
          onEditSave={editUnavailableFoodItem}
          handleImageChange={handleImageChange}
          onEditClick={(foodId, food) => {
            setAvailableEditingId(foodId);
            setEditingFoodId(null);
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

      {/* Expired Products Table */}
      <div style={{ marginTop: '40px' }}>
        <ExpiredProductsTable 
          foods={expiredFoods} 
          currentUser={currentUser} 
          setExpiredFoods={setExpiredFoods}
        />
      </div>
    </div>
  );
}

export default Dashboard;