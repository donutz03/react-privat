import React, { useState, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';

const FriendsManager = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [sharedListAccess, setSharedListAccess] = useState([]);
  const [newFriend, setNewFriend] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriendsData();
  }, [currentUser]);

  const fetchFriendsData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}`);
      const data = await response.json();
      setFriends(data.friends || []);
      setSharedListAccess(data.sharedListAccess || []);
      setLoading(false);
    } catch (err) {
      setError('Eroare la încărcarea prietenilor');
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!newFriend.trim()) {
      setError('Introduceți un nume de utilizator');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername: newFriend })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setFriends(data.friends);
      setNewFriend('');
      setSuccess('Prieten adăugat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Eroare la adăugarea prietenului');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleAccess = async (friendUsername) => {
    const newAccess = sharedListAccess.includes(friendUsername)
      ? sharedListAccess.filter(f => f !== friendUsername)
      : [...sharedListAccess, friendUsername];

    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFriends: newAccess })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSharedListAccess(data.sharedListAccess);
      setSuccess('Acces actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Eroare la actualizarea accesului');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '1rem' }}>Se încarcă...</div>;
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        Gestionare Prieteni
      </h2>
      
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <input
          type="text"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          placeholder="Nume utilizator"
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            flex: 1
          }}
        />
        <button
          onClick={addFriend}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Adaugă Prieten
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ 
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          Lista Prietenilor
        </h3>
        {friends.length === 0 ? (
          <p style={{ color: '#666' }}>Nu ai niciun prieten adăugat</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {friends.map((friend) => (
              <div
                key={friend}
                style={{
                  padding: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: '500' }}>{friend}</span>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Switch.Root
                    checked={sharedListAccess.includes(friend)}
                    onCheckedChange={() => toggleAccess(friend)}
                    style={{
                      width: '42px',
                      height: '25px',
                      backgroundColor: sharedListAccess.includes(friend) ? '#2196F3' : '#ccc',
                      borderRadius: '9999px',
                      position: 'relative',
                      WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                  >
                    <Switch.Thumb
                      style={{
                        display: 'block',
                        width: '21px',
                        height: '21px',
                        backgroundColor: 'white',
                        borderRadius: '9999px',
                        transition: 'transform 100ms',
                        transform: sharedListAccess.includes(friend) ? 'translateX(19px)' : 'translateX(2px)',
                        willChange: 'transform'
                      }}
                    />
                  </Switch.Root>
                  <span style={{ 
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {sharedListAccess.includes(friend) ? 'Are acces' : 'Fără acces'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsManager;