const ExpiredProductsTable = ({ foods, currentUser, setExpiredFoods }) => {
    const handleDelete = async (foodId) => {
      try {
        const response = await fetch(`http://localhost:5000/foods/expired/${currentUser}/${foodId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Eroare la ștergerea produsului expirat');
        }
        
        const updatedFoods = await response.json();
        setExpiredFoods(updatedFoods);
      } catch (error) {
        console.error('Eroare la ștergerea produsului expirat:', error);
      }
    };
  
    const handleDeleteAllExpired = async () => {
      try {
        const response = await fetch(`http://localhost:5000/foods/expired/${currentUser}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Eroare la ștergerea produselor expirate');
        }
        
        setExpiredFoods([]);
      } catch (error) {
        console.error('Eroare la ștergerea produselor expirate:', error);
      }
    };
  
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '10px' 
        }}>
          <h2>Produse Expirate</h2>
          {foods.length > 0 && (
            <button
              onClick={handleDeleteAllExpired}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Ștergere produse expirate
            </button>
          )}
        </div>
        
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
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.expirationDate}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.categories.join(', ')}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button
                    onClick={() => handleDelete(food.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {foods.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Nu există produse expirate
          </p>
        )}
      </div>
    );
  };
  
  export default ExpiredProductsTable;