import React, { useRef } from 'react';
import { Facebook, Instagram, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const SocialShare = ({ foods }) => {
    const tableRef = useRef(null);

    const generateImage = async () => {
        if (!tableRef.current) return null;

        try {
            const canvas = await html2canvas(tableRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
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
            <div ref={tableRef} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Produse Disponibile</h3>
                <table className="w-full border-collapse">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Produs</th>
                        <th className="border p-2 text-left">Data Expirării</th>
                        <th className="border p-2 text-left">Categorii</th>
                    </tr>
                    </thead>
                    <tbody>
                    {foods.map((food) => (
                        <tr key={food.id}>
                            <td className="border p-2">{food.name}</td>
                            <td className="border p-2">{food.expirationDate}</td>
                            <td className="border p-2">{food.categories.join(', ')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SocialShare;