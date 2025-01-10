const ExpiredProductsTable = ({ foods, currentUser, setExpiredFoods }) => {
  const handleDeleteExpiredProducts = () => {
      fetch(`http://localhost:5000/foods/expired/${currentUser}`, {
          method: 'DELETE',
      })
          .then((res) => res.json())
          .then(() => {
              setExpiredFoods([]); // Golim lista de produse expirate
          })
          .catch((err) => console.error('Eroare la ștergerea produselor expirate:', err));
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
                      onClick={handleDeleteExpiredProducts}
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
          <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              marginTop: '20px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
              <thead>
                  <tr>
                      <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '12px 8px',
                          backgroundColor: '#f5f5f5'
                      }}>
                          Aliment
                      </th>
                      <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '12px 8px',
                          backgroundColor: '#f5f5f5'
                      }}>
                          Data Expirare
                      </th>
                      <th style={{ 
                          border: '1px solid #ddd', 
                          padding: '12px 8px',
                          backgroundColor: '#f5f5f5'
                      }}>
                          Categorii
                      </th>
                  </tr>
              </thead>
              <tbody>
                  {foods.map((food) => (
                      <tr key={food.id}>
                          <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '12px 8px',
                              color: '#d32f2f'  // Roșu pentru a evidenția că este expirat
                          }}>
                              {food.name}
                          </td>
                          <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '12px 8px',
                              color: '#d32f2f'
                          }}>
                              {food.expirationDate}
                          </td>
                          <td style={{ 
                              border: '1px solid #ddd', 
                              padding: '12px 8px'
                          }}>
                              {food.categories.map((category, idx) => (
                                  <span
                                      key={`${food.id}-${category}`}
                                      style={{
                                          display: 'inline-block',
                                          padding: '2px 8px',
                                          margin: '2px',
                                          backgroundColor: '#f5f5f5',
                                          borderRadius: '12px',
                                          fontSize: '0.9em'
                                      }}
                                  >
                                      {category}
                                  </span>
                              ))}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {foods.length === 0 && (
              <p style={{ 
                  textAlign: 'center', 
                  color: '#666',
                  padding: '20px'
              }}>
                  Nu există produse expirate
              </p>
          )}
      </div>
  );
}

export default ExpiredProductsTable;