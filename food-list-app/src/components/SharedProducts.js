import React, { useState, useEffect } from 'react';

const SharedProducts = ({ currentUser, setShowSharedProducts }) => {
  const [sharedProducts, setSharedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchSharedProducts();
  }, [currentUser]);

  const fetchSharedProducts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/shared-products`);
      const data = await response.json();
      setSharedProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Eroare la încărcarea produselor împărtășite');
      setLoading(false);
    }
  };

  const handleClaimProduct = async (friendUsername, productId) => {
    try {
      const response = await fetch(`http://localhost:5000/foods/${friendUsername}/claim/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ claimedBy: currentUser })
      });

      if (response.ok) {
        // Actualizăm lista după ce produsul a fost revendicat
        fetchSharedProducts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Eroare la revendicarea produsului');
      }
    } catch (err) {
      setError('Eroare la revendicarea produsului');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#666' 
      }}>
        Se încarcă...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '4px',
        margin: '1rem'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2>Produse disponibile de la prieteni</h2>
        <button
          onClick={() => setShowSharedProducts(false)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Înapoi la Produse
        </button>
      </div>

      {Object.keys(sharedProducts).length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
          Nu există produse disponibile de la prieteni momentan.
        </p>
      ) : (
        Object.entries(sharedProducts).map(([friend, products]) => (
          <div key={friend} style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              Produse de la {friend}
            </h3>
            
            {products.length === 0 ? (
              <p style={{ color: '#666', padding: '10px' }}>
                Nu are produse disponibile momentan.
              </p>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: '15px', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
              }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      padding: '15px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      ':hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <h4 style={{ marginBottom: '8px', color: '#2196F3' }}>
                      {product.name}
                    </h4>
                    <p style={{ 
                      color: '#666', 
                      fontSize: '14px', 
                      marginBottom: '8px' 
                    }}>
                      Expiră la: {product.expirationDate}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '4px',
                      marginBottom: '12px'
                    }}>
                      {product.categories.map((category, idx) => (
                        <span
                          key={`${product.id}-${category}`}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#1976d2'
                          }}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleClaimProduct(friend, product.id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Revendică Produsul
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SharedProducts;