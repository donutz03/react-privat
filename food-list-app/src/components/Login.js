import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('currentUser', username);
        localStorage.setItem('userContact', JSON.stringify({
          phone: data.user?.phone,
          address: data.user?.address
        }));
        navigate('/');
      } else {
        alert(data.message || 'Eroare la autentificare');
      }
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      alert('Eroare la autentificare');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
      <h2>Autentificare</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Nume utilizator"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '8px' }}
        />
        <button 
          type="submit"
          style={{ 
            padding: '10px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Autentificare
        </button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/register" style={{ color: '#2196F3', textDecoration: 'none' }}>
          Nu ai cont? Înregistrează-te aici
        </Link>
      </div>
    </div>
  );
}