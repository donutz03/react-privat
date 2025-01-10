import React, { useState } from 'react';
import { Image } from 'lucide-react';

const ImageUpload = ({ onImageSelect }) => {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center">
        <Image className="w-8 h-8 text-gray-400" />
        <span className="mt-2 text-sm text-gray-500">Click pentru a adăuga o imagine</span>
      </div>
    </div>
  );
};

export default ImageUpload;