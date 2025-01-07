

const ExpiredProductsTable = ({ foods, currentUser, setExpiredFoods }) =>  {
    const handleDeleteExpiredProducts = () => {
        fetch(`http://localhost:5000/foods-expired/${currentUser}`, {
          method: 'DELETE',
        })
          .then((res) => res.json())
          .then(() => {
            setExpiredFoods([]); // Clear expired foods from state
          })
          .catch((err) => console.error('Eroare la ștergerea produselor expirate:', err));
      };
    return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Aliment</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data Expirare</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Categorii</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((food, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.expirationDate}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{food.categories.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

  export default ExpiredProductsTable