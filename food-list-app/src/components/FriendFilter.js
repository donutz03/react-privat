import React, { useState, useEffect } from 'react';

const FriendFilter = ({ onFilterChange }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  useEffect(() => {
    fetch('/friends/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch(error => console.error('Eroare la încărcarea etichetelor:', error));
  }, []);

  const handleTagToggle = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    onFilterChange(newSelectedTags);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>Filtrează prietenii după preferințe:</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: selectedTags.includes(tag) ? '#2196F3' : '#e0e0e0',
              color: selectedTags.includes(tag) ? 'white' : 'black',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tag}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <button
          onClick={() => {
            setSelectedTags([]);
            onFilterChange([]);
          }}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f44336',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Resetează filtrele
        </button>
      )}
    </div>
  );
};

export default FriendFilter;