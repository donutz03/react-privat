import React from 'react';
import { Facebook, Instagram } from 'lucide-react';

const SocialShare = ({ foods }) => {
  const shareToFacebook = () => {
    // Get the first available food's image
    const firstFood = foods[0];
    if (!firstFood || !firstFood.imageUrl) {
      alert('Nu există imagini disponibile pentru share');
      return;
    }

    // Construim URL-ul complet pentru imagine
    const imageUrl = `http://localhost:5000${firstFood.imageUrl}`;
    
    // Folosim og:image pentru a include imaginea
    const url = `https://www.facebook.com/dialog/share?
      app_id=YOUR_APP_ID&
      display=popup&
      href=${encodeURIComponent(window.location.href)}&
      picture=${encodeURIComponent(imageUrl)}&
      title=${encodeURIComponent('Produse disponibile')}&
      caption=${encodeURIComponent('Food Sharing App')}`.replace(/\s+/g, '');

    const width = 600;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      url,
      'facebook-share-dialog',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  const shareToInstagram = () => {
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = 'instagram://camera';
    } else {
      window.open('https://www.instagram.com', '_blank');
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      marginTop: '20px'
    }}>
      <button
        onClick={shareToFacebook}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#1877F2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        <Facebook size={20} />
        Share on Facebook
      </button>
      
      <button
        onClick={shareToInstagram}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#E4405F',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        <Instagram size={20} />
        Share on Instagram
      </button>
    </div>
  );
};

export default SocialShare;