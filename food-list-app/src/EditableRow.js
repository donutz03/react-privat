const EditableRow = ({ 
    food, 
    index, 
    editFood,
    setEditFood,
    onSave,
    onCancel,
    availableCategories,
    handleEditCategoryChange 
  }) => {
    // Create a ref for the input
    const inputRef = useRef(null);
    
    // Focus the input when the component mounts
    useEffect(() => {
      inputRef.current?.focus();
    }, []);
  
    // Memoize the change handler to prevent recreating it on every render
    const handleNameChange = useCallback((e) => {
      setEditFood(prev => ({ ...prev, name: e.target.value }));
    }, [setEditFood]);
  
    const today = new Date().toISOString().split('T')[0];
  
    return (
      <>
        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={editFood.name}
            onChange={handleNameChange}
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
            onClick={() => onSave(index)}
            style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Salvează
          </button>
          <button 
            onClick={onCancel}
            style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Anulează
          </button>
        </td>
      </>
    );
  };

  export default EditableRow;