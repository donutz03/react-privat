import React from 'react';
import { Facebook, Instagram, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const SocialShare = ({ foods }) => {
    const createProductsPreview = () => {
        // Creăm container-ul principal
        const container = document.createElement('div');
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.maxWidth = '1200px';
        container.style.margin = '0 auto';

        // Adăugăm titlul
        const title = document.createElement('h3');
        title.textContent = 'Produse Disponibile';
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        container.appendChild(title);

        // Creăm grid-ul pentru produse
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '20px';
        grid.style.padding = '20px';

        // Adăugăm fiecare produs
        foods.forEach(food => {
            const card = document.createElement('div');
            card.style.backgroundColor = '#f8f9fa';
            card.style.borderRadius = '8px';
            card.style.padding = '16px';
            card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

            if (food.imageUrl) {
                const img = document.createElement('img');
                img.src = `${food.imageUrl}`;
                img.crossOrigin = 'anonymous';
                img.style.width = '100%';
                img.style.height = '200px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                img.style.marginBottom = '12px';
                card.appendChild(img);
            }

            const name = document.createElement('h4');
            name.textContent = food.name;
            name.style.fontSize = '18px';
            name.style.fontWeight = 'bold';
            name.style.marginBottom = '8px';
            card.appendChild(name);

            const date = document.createElement('p');
            date.textContent = `Expiră la: ${food.expirationDate}`;
            date.style.color = '#666';
            date.style.marginBottom = '8px';
            card.appendChild(date);

            const categories = document.createElement('div');
            categories.style.display = 'flex';
            categories.style.flexWrap = 'wrap';
            categories.style.gap = '4px';

            food.categories.forEach(category => {
                const tag = document.createElement('span');
                tag.textContent = category;
                tag.style.backgroundColor = '#e3f2fd';
                tag.style.color = '#1976d2';
                tag.style.padding = '4px 8px';
                tag.style.borderRadius = '12px';
                tag.style.fontSize = '12px';
                categories.appendChild(tag);
            });

            card.appendChild(categories);
            grid.appendChild(card);
        });

        container.appendChild(grid);
        return container;
    };

    const generateImage = async () => {
        try {
            const container = createProductsPreview();

            // Adăugăm temporar la body pentru html2canvas, dar ascuns
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            // Așteptăm încărcarea imaginilor
            const images = container.getElementsByTagName('img');
            await Promise.all([...images].map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true
            });

            // Curățăm după noi
            document.body.removeChild(container);

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
    );
};

export default SocialShare;