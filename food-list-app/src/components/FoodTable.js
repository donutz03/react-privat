import React from 'react';
import CategoryCheckboxes from './components/CategoryCheckboxes';

const FoodTable = ({ 
  foods,
  isAvailableTable,
  onDelete,
  editingId,  // Modificat din editingIndex
  setEditingId,  // Modificat din setEditingIndex
  editFood,
  setEditFood,
  onEditSave,
  onEditClick,
  handleEditCategoryChange,
  availableCategories,
  handleMarkAvailability
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const preventDateTyping = (e) => {
    if (e.key !== 'Tab' && e.key !== 'Enter') {
      e.preventDefault();
    }
  };

  const isNearExpiration = (expirationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFood({ name: '', expirationDate: '', categories: [] });
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Aliment</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data Expirare</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Categorii</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        {foods.map((food) => (
          <tr key={food.id}> 
            {editingId === food.id ? (  
              <>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="text"
                    value={editFood.name}
                    onChange={(e) => setEditFood(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '4px' }}
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="date"
                    value={editFood.expirationDate}
                    onKeyDown={preventDateTyping}
                    min={today}
                    onChange={(e) => setEditFood(prev => ({ ...prev, expirationDate: e.target.value }))}
                    style={{ width: '100%', padding: '4px' }}
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <CategoryCheckboxes
                    selectedCategories={editFood.categories}
                    onChange={handleEditCategoryChange}
                    availableCategories={availableCategories}
                  />
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => onEditSave(food.id)}  
                    style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Salvează
                  </button>
                  <button 
                    onClick={handleCancel}
                    style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Anulează
                  </button>
                </td>
              </>
            ) : (
              <>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.expirationDate}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.categories.join(', ')}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button 
                    onClick={() => onEditClick(food.id, food)}  
                    style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Editează
                  </button>
                  <button 
                    onClick={() => onDelete(food.id)} 
                    style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Șterge
                  </button>
                  {isAvailableTable ? (
                    isNearExpiration(food.expirationDate) && (
                      <button 
                        onClick={() => handleMarkAvailability(food.id, true)} 
                        style={{ padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Marchează disponibil
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => handleMarkAvailability(food.id, false)}  
                      style={{ padding: '4px 8px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Marchează indisponibil
                    </button>
                  )}
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FoodTable;