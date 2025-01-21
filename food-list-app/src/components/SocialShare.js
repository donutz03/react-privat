import React, { useRef } from 'react';
import { Facebook, Instagram, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const SocialShare = ({ foods }) => {
    const tableRef = useRef(null);

    const generateImage = async () => {
        if (!tableRef.current) return null;

        try {
            // Wait for images to load before generating canvas
            const images = tableRef.current.getElementsByTagName('img');
            await Promise.all([...images].map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
    };

    const downloadImage = async () => {
        const dataUrl = await generateImage();
        if (!dataUrl) {
            alert('Nu s-a putut genera imaginea');
            return;
        }

        const link = document.createElement('a');
        link.download = 'produse-disponibile.png';
        link.href = dataUrl;
        link.click();
    };

    const shareToFacebook = () => {
        window.open('https://www.facebook.com', '_blank');
    };

    const shareToInstagram = () => {
        window.open('https://www.instagram.com', '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    onClick={shareToFacebook}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1864D9] transition-colors"
                >
                    <Facebook size={20} />
                    Share pe Facebook
                </button>

                <button
                    onClick={shareToInstagram}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E4405F] text-white rounded-lg hover:bg-[#D1274A] transition-colors"
                >
                    <Instagram size={20} />
                    Share pe Instagram
                </button>

                <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <Download size={20} />
                    Descarcă imagine
                </button>
            </div>

            {/* Table to be converted to image */}
            <div ref={tableRef} className="bg-white p-4 rounded-lg shadow max-w-4xl">
                <h3 className="text-xl font-bold mb-4 text-center">Produse Disponibile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {foods.map((food) => (
                        <div key={food.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                            {food.imageUrl && (
                                <img
                                    src={`http://localhost:5000${food.imageUrl}`}
                                    alt={food.name}
                                    className="w-full h-48 object-cover rounded-lg mb-3"
                                    crossOrigin="anonymous"
                                />
                            )}
                            <h4 className="font-semibold text-lg mb-2">{food.name}</h4>
                            <p className="text-gray-600 text-sm mb-2">
                                Expiră la: {food.expirationDate}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {food.categories.map((category, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                    >
                    {category}
                  </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SocialShare;