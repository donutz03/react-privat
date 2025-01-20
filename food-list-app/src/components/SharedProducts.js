import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpandableImage from './ExpandableImage';

// Custom Alert Component for notifications remains the same
const CustomAlert = ({ message, type = 'error' }) => (
  <div 
    className={`p-4 mb-4 rounded ${
      type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}
  >
    {message}
  </div>
);

// Updated ProductCard Component with image support
const ProductCard = ({ product, onClaim, friendUsername }) => (
  <div
    style={{
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
  >
    {/* Image Section */}
    <div style={{ marginBottom: '12px' }}>
      {product.imageUrl ? (
        <ExpandableImage
          src={`http://localhost:5000${product.imageUrl}`}
          alt={product.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      ) : (
        <div style={{
          width: '100%',
          height: '192px', // equivalent to h-48
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ color: '#999' }}>Fără imagine</span>
        </div>
      )}
    </div>

    {/* Product Details */}
    <h4 style={{ 
      marginBottom: '8px', 
      color: '#2196F3',
      fontSize: '1.1rem',
      fontWeight: '500'
    }}>
      {product.name}
    </h4>
    
    <p style={{ 
      color: '#666', 
      fontSize: '0.9rem', 
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
      {product.categories.map((category) => (
        <span
          key={`${product.id}-${category}`}
          style={{
            padding: '4px 8px',
            backgroundColor: '#e3f2fd',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#1976d2'
          }}
        >
          {category}
        </span>
      ))}
    </div>

    {/* Claim Button */}
    <button
      onClick={() => onClaim(friendUsername, product.id)}
      style={{
        width: '100%',
        padding: '8px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
    >
      Revendică Produsul
    </button>
  </div>
);

// Main SharedProducts Component
const SharedProducts = () => {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('currentUser');
  
  // State management
  const [sharedProducts, setSharedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimedProducts, setClaimedProducts] = useState(new Set());

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      fetchSharedProducts();
    }
  }, [currentUser, navigate]);

  const fetchSharedProducts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/shared-products`);
      if (!response.ok) {
        throw new Error('Failed to fetch shared products');
      }
      const data = await response.json();
      setSharedProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching shared products:', err);
      setError('Error loading shared products');
      setLoading(false);
    }
  };

  const handleClaimProduct = async (friendUsername, productId) => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${friendUsername}/claim/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ claimedBy: currentUser })
      });

      if (!response.ok) {
        throw new Error('Failed to claim product');
      }

      setSharedProducts(prevProducts => {
        const newProducts = { ...prevProducts };
        if (newProducts[friendUsername]) {
          newProducts[friendUsername] = newProducts[friendUsername].filter(p => p.id !== productId);
          if (newProducts[friendUsername].length === 0) {
            delete newProducts[friendUsername];
          }
        }
        return newProducts;
      });

      setClaimedProducts(prev => new Set([...prev, productId]));
      fetchSharedProducts();

    } catch (err) {
      console.error('Error claiming product:', err);
      setError('Error claiming product');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Se încarcă...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Produse disponibile de la prieteni
        </h2>
        <button
          onClick={() => navigate('/')}
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

      {/* Error Notifications */}
      {claimError && <CustomAlert message={claimError} />}
      {error && <CustomAlert message={error} />}

      {/* Products Grid */}
      {Object.keys(sharedProducts).length === 0 ? (
        <p style={{ 
          color: '#666', 
          textAlign: 'center', 
          padding: '2rem' 
        }}>
          Nu există produse disponibile de la prieteni momentan.
        </p>
      ) : (
        Object.entries(sharedProducts).map(([friend, products]) => (
          <div key={friend} style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              Produse de la {friend}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClaim={handleClaimProduct}
                  friendUsername={friend}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SharedProducts;