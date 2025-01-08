import React, { useState, useEffect } from 'react';

const SharedProducts = ({ currentUser, setShowSharedProducts }) => {
  const [sharedProducts, setSharedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '1rem' }}>Se încarcă...</div>;
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '4px'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Produse disponibile de la prieteni</h2>
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
      {Object.keys(sharedProducts).length === 0 ? (
        <p style={{ color: '#666' }}>
          Nu există produse disponibile de la prieteni momentan.
        </p>
      ) : (
        Object.entries(sharedProducts).map(([friend, products]) => (
          <div key={friend} style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>Produse de la {friend}</h3>
            {products.length === 0 ? (
              <p style={{ color: '#666' }}>Nu are produse disponibile momentan.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {products.map((product, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <h4 style={{ marginBottom: '8px' }}>{product.name}</h4>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                      Expiră la: {product.expirationDate}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {product.categories.map((category, catIndex) => (
                        <span
                          key={catIndex}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
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