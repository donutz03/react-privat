const CategoryCheckboxes = ({ selectedCategories, onChange, availableCategories }) => (
    <div className="categories-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0' }}>
      {availableCategories.map((category) => (
        <label key={category} style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
          <input
            type="checkbox"
            checked={selectedCategories.includes(category)}
            onChange={() => onChange(category)}
          />
          <span style={{ marginLeft: '5px' }}>{category}</span>
        </label>
      ))}
    </div>
  );

  export default CategoryCheckboxes