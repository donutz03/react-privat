import React, { useState, useEffect } from 'react';
import FriendFilter from './FriendFilter';

const FriendsManager = ({ currentUser }) => {
  const [friends, setFriends] = useState({});
  const [filteredFriends, setFilteredFriends] = useState({});
  const [sharedListAccess, setSharedListAccess] = useState([]);
  const [newFriend, setNewFriend] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState([]);

  useEffect(() => {
    fetchFriendsData();
    fetchAvailableTags();
  }, [currentUser]);

  const fetchFriendsData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}`);
      const data = await response.json();
      setFriends(data.friends || {});
      setFilteredFriends(data.friends || {});
      setSharedListAccess(data.sharedListAccess || []);
      setGroups(data.groups || []);
      setLoading(false);
    } catch (err) {
      setError('Eroare la încărcarea prietenilor');
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Introduceți un nume pentru grup');
      return;
    }
  
    if (selectedFriendsForGroup.length === 0) {
      setError('Selectați cel puțin un prieten pentru grup');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: newGroupName,
          members: selectedFriendsForGroup
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }
  
      setGroups(data.groups);
      setNewGroupName('');
      setSelectedFriendsForGroup([]);
      setSuccess('Grup creat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Eroare la crearea grupului');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFilterChange = async (selectedTags) => {
    if (!selectedTags || selectedTags.length === 0) {
      setFilteredFriends(friends);
      return;
    }

    try {
      const queryParams = selectedTags.join(',');
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/filter?tags=${queryParams}`);
      const data = await response.json();
      setFilteredFriends(data.friends);
    } catch (err) {
      console.error('Eroare la filtrarea prietenilor:', err);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await fetch('http://localhost:5000/friends/tags');
      const data = await response.json();
      setAvailableTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Eroare la încărcarea etichetelor disponibile:', err);
      setAvailableTags([]);
    }
  };
  const addFriend = async () => {
    if (!newFriend.trim()) {
      setError('Introduceți un nume de utilizator');
      return;
    }
  
    if (newFriend === currentUser) {
      setError('Nu vă puteți adăuga pe dvs. ca prieten');
      setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      setNewFriend(''); // Clear input
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername: newFriend })
      });
  
      const data = await response.json();
  
      if (response.status === 404) {
        setError('Utilizatorul nu există!');
        setTimeout(() => setError(''), 3000);
        return;
      }
  
      if (!response.ok) {
        throw new Error(data.message);
      }
  
      setFriends(data.friends);
      setFilteredFriends(data.friends);
      setNewFriend('');
      setSuccess('Prieten adăugat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Eroare la adăugarea prietenului');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleTag = async (friendUsername, tag) => {
    const currentTags = friends[friendUsername] || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/friends/${friendUsername}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      });

      if (!response.ok) {
        throw new Error('Eroare la actualizarea etichetelor');
      }

      const data = await response.json();
      setFriends(data.friends);
      setFilteredFriends(data.friends);
    } catch (err) {
      setError('Eroare la actualizarea etichetelor');
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

      if (!response.ok) {
        throw new Error('Eroare la actualizarea accesului');
      }

      const data = await response.json();
      setSharedListAccess(data.sharedListAccess);
    } catch (err) {
      setError('Eroare la actualizarea accesului');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '1rem' }}>Se încarcă...</div>;
  }
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>
        Gestionare Prieteni 
        <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#666' }}>
          (Total prieteni: {Object.keys(friends).length})
        </span>
      </h2>
      
      <FriendFilter onFilterChange={handleFilterChange} />

      {/* Adăugare prieten nou */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          placeholder="Nume utilizator"
          style={{
            padding: '8px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={addFriend}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Adaugă Prieten
        </button>
      </div>

      {/* Creare grup nou */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Creare Grup Nou</h3>
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Nume grup"
          style={{
            padding: '8px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <h4>Selectează membri:</h4>
          {Object.keys(friends).map(friend => (
            <label key={friend} style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={selectedFriendsForGroup.includes(friend)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFriendsForGroup([...selectedFriendsForGroup, friend]);
                  } else {
                    setSelectedFriendsForGroup(
                      selectedFriendsForGroup.filter(f => f !== friend)
                    );
                  }
                }}
              />
              <span style={{ marginLeft: '5px' }}>{friend}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleCreateGroup}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Creează Grup
        </button>
      </div>

      {/* Lista grupuri */}
      {groups.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Grupuri</h3>
          {groups.map((group, index) => (
            <div
              key={index}
              style={{
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            >
              <h4>{group.name}</h4>
              <p>Membri: {group.members.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mesaje de eroare și succes */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {success}
        </div>
      )}

      {/* Lista de prieteni filtrată */}
      <div style={{ marginTop: '20px' }}>
        {Object.entries(filteredFriends).map(([friendUsername, friendTags]) => (
          <div
            key={friendUsername}
            style={{
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>{friendUsername}</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={sharedListAccess.includes(friendUsername)}
                  onChange={() => toggleAccess(friendUsername)}
                />
                Acces la lista de produse
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Array.isArray(availableTags) && availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(friendUsername, tag)}
                  style={{
                    padding: '4px 12px',
                    border: 'none',
                    borderRadius: '16px',
                    backgroundColor: (friendTags || []).includes(tag) ? '#2196F3' : '#e0e0e0',
                    color: (friendTags || []).includes(tag) ? 'white' : 'black',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsManager;