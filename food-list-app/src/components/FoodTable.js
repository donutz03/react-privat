import React from 'react';
import CategoryCheckboxes from './CategoryCheckboxes';
import { Image } from 'lucide-react';

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
    <table className="w-full border-collapse mt-5">
      <thead>
        <tr>
          <th className="border border-gray-300 p-2">Imagine</th>
          <th className="border border-gray-300 p-2">Aliment</th>
          <th className="border border-gray-300 p-2">Data Expirare</th>
          <th className="border border-gray-300 p-2">Categorii</th>
          <th className="border border-gray-300 p-2">Acțiuni</th>
        </tr>
      </thead>
      <tbody>
        {foods.map((food) => (
          <tr key={food.id}> 
            {editingId === food.id ? (
              <>
                <td className="border border-gray-300 p-2 w-32">
                  <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {editFood.image || food.imageUrl ? (
                      <img
                        src={editFood.image ? URL.createObjectURL(editFood.image) : `http://localhost:5000${food.imageUrl}`}
                        alt="Food preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Image className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Click pentru imagine</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={editFood.name}
                    onChange={(e) => setEditFood(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="date"
                    value={editFood.expirationDate}
                    onKeyDown={preventDateTyping}
                    min={today}
                    onChange={(e) => setEditFood(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <CategoryCheckboxes
                    selectedCategories={editFood.categories}
                    onChange={handleEditCategoryChange}
                    availableCategories={availableCategories}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <button 
                    onClick={() => onEditSave(food.id)}  
                    className="mr-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Salvează
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Anulează
                  </button>
                </td>
              </>
            ) : (
              <>
                <td className="border border-gray-300 p-2 w-32">
                  {food.imageUrl ? (
                    <img
                      src={`http://localhost:5000${food.imageUrl}`}
                      alt={food.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">Fără imagine</span>
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 p-2">{food.name}</td>
                <td className="border border-gray-300 p-2">{food.expirationDate}</td>
                <td className="border border-gray-300 p-2">{food.categories.join(', ')}</td>
                <td className="border border-gray-300 p-2">
                  <button 
                    onClick={() => onEditClick(food.id, food)}  
                    className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Editează
                  </button>
                  <button 
                    onClick={() => onDelete(food.id)} 
                    className="mr-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Șterge
                  </button>
                  {isAvailableTable ? (
                    isNearExpiration(food.expirationDate) && (
                      <button 
                        onClick={() => handleMarkAvailability(food.id, true)} 
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Marchează disponibil
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => handleMarkAvailability(food.id, false)}  
                      className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
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