import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ foods, onMarkAvailable }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Acum filtrăm direct folosind proprietatea isNearExpiration din backend
  const nearExpirationFoods = foods.filter(food => food.isNearExpiration);
  
  return (
    <div style={{ position: 'relative' }}>
      <div 
        style={{ 
          position: 'relative', 
          cursor: 'pointer' 
        }}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell size={24} />
        {nearExpirationFoods.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px'
          }}>
            {nearExpirationFoods.length}
          </span>
        )}
      </div>
      
      {showNotifications && nearExpirationFoods.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '300px',
          backgroundColor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          padding: '10px',
          zIndex: 1000
        }}>
          <h3>Produse aproape de expirare:</h3>
          {nearExpirationFoods.map((food) => (
            <div key={food.id} style={{
              padding: '10px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ margin: 0 }}>{food.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Expiră la: {food.expirationDate}
                </p>
              </div>
              <button
                onClick={() => {
                  onMarkAvailable(food.id); // Folosim ID-ul în loc de index
                  setShowNotifications(false);
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Marchează disponibil
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;