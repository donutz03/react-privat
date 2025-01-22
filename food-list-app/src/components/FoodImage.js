const FoodImage = ({ imageUrl }) => {
    if (!imageUrl) return null;
  
    return (
      <div className="relative w-full h-32">
        <img
          src={`${imageUrl}`}
          alt="Food"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  };

export default FoodImage;