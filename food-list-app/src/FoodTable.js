// FoodTable.js
const FoodTable = ({ 
  foods,
  isAvailableTable,
  onDelete,
  editingIndex,
  setUnavailableEditingIndex, // vom înlocui acest prop
  editFood,
  setEditFood,
  onEditSave,
  onEditClick,
  handleEditCategoryChange,
  availableCategories
}) => {
  const today = new Date().toISOString().split('T')[0];

  const handleCancel = () => {
    if (isAvailableTable) {
      setUnavailableEditingIndex(null);
    } else {
      // Folosim props-ul corect pentru tabelul de produse partajate
      setAvailableEditingIndex(null);
    }
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
        {foods.map((food, index) => (
          <tr key={index}>
            {editingIndex === index ? (
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
                    onClick={() => onEditSave(index)}
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
                    onClick={() => onEditClick(index, food)}
                    style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Editează
                  </button>
                  <button 
                    onClick={() => onDelete(index)}
                    style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Șterge
                  </button>
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