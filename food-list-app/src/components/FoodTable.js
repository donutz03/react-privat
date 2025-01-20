import React from 'react';
import CategoryCheckboxes from './CategoryCheckboxes';
import { Image } from 'lucide-react';
import SocialShare from './SocialShare';
import ExpandableImage from './ExpandableImage';

const FoodTable = ({ 
  foods,
  isAvailableTable,
  onDelete,
  editingId,
  setEditingId,
  editFood,
  setEditFood,
  onEditSave,
  onEditClick,
  handleEditCategoryChange,
  availableCategories,
  handleMarkAvailability,
  handleImageChange
}) => {
  const safefoods = Array.isArray(foods) ? foods : [];

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
    setEditFood({ name: '', expirationDate: '', categories: [], image: null });
  };

  return (
    <div>
      {!isAvailableTable && safefoods.length > 0 && (
        <SocialShare foods={safefoods} />
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>Imagine</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Aliment</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data Expirare</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Categorii</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {safefoods.map((food) => {
            const isEditing = editingId === food.id;
            return (
              <tr key={food.id}>
                {isEditing ? (
                  <>
                    <td style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>
                      <div style={{ 
                        position: 'relative',
                        width: '100%',
                        height: '120px',
                        border: '2px dashed #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => handleImageChange(e.target.files[0])}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                        {editFood.image || food.imageUrl ? (
                          <ExpandableImage
                            src={editFood.image ? URL.createObjectURL(editFood.image) : `http://localhost:5000${food.imageUrl}`}
                            alt="Food preview"
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <Image style={{ width: '24px', height: '24px', color: '#999' }} />
                            <span style={{ 
                              display: 'block', 
                              marginTop: '8px',
                              fontSize: '12px',
                              color: '#666'
                            }}>
                              Click pentru imagine
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <input
                        type="text"
                        value={editFood.name}
                        onChange={(e) => setEditFood(prev => ({ ...prev, name: e.target.value }))}
                        style={{ width: '100%', padding: '4px' }}
                        required
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
                        required
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
                    <td style={{ border: '1px solid #ddd', padding: '8px', width: '120px' }}>
                      {food.imageUrl ? (
                        <ExpandableImage
                          src={`http://localhost:5000${food.imageUrl}`}
                          alt={food.name}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '120px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ color: '#999' }}>Fără imagine</span>
                        </div>
                      )}
                    </td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FoodTable;