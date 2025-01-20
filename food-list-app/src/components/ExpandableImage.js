import React, { useState } from 'react';

const ExpandableImage = ({ src, alt, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={handleClick}
        className={`cursor-pointer transition-all duration-300 ${className} ${
          isExpanded ? 'fixed top-0 left-0 w-screen h-screen object-contain z-50 bg-black/75' : ''
        }`}
        style={{
          maxHeight: isExpanded ? '100vh' : '120px'
        }}
      />
    </>
  );
};

export default ExpandableImage;