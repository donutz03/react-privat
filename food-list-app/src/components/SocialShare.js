import React, { useEffect, useState } from 'react';
import { Share2, Facebook, Instagram } from 'lucide-react';

const SocialShare = ({ foods }) => {
  const [isFBLoaded, setIsFBLoaded] = useState(false);
  const [isLoggedInFB, setIsLoggedInFB] = useState(false);

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });

        // Check Facebook login status
        window.FB.getLoginStatus(function(response) {
          setIsLoggedInFB(response.status === 'connected');
        });

        setIsFBLoaded(true);
      };

      // Load SDK asynchronously
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, []);

  const handleFacebookLogin = (callback) => {
    window.FB.login(function(response) {
      if (response.status === 'connected') {
        setIsLoggedInFB(true);
        if (callback) callback();
      }
    }, { scope: 'public_profile,publish_to_groups' });
  };

  const shareToFacebook = () => {
    const shareFBContent = () => {
      const content = {
        method: 'feed',
        link: window.location.href,
        message: 'Check out these available products!',
        caption: 'Products available for sharing',
        description: foods.map(food => 
          `${food.name} - Expires: ${food.expirationDate}\nCategories: ${food.categories.join(', ')}`
        ).join('\n\n')
      };

      window.FB.ui(content, function(response) {
        if (response && !response.error_message) {
          alert('Successfully shared on Facebook!');
        } else {
          alert('Error sharing to Facebook');
        }
      });
    };

    if (!isLoggedInFB) {
      handleFacebookLogin(() => shareFBContent());
    } else {
      shareFBContent();
    }
  };

  const shareToInstagram = async () => {
    // First, check if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Instagram app
      window.location.href = 'instagram://story-camera';
      
      // Fallback to Instagram web after a short delay if app doesn't open
      setTimeout(() => {
        window.location.href = 'https://www.instagram.com';
      }, 500);
    } else {
      // On desktop, direct to Instagram web
      window.open('https://www.instagram.com', '_blank');
    }
    
    alert('Please log in to Instagram to share your story.');
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '16px',
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <button
        onClick={shareToFacebook}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#1877F2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        <Facebook size={16} />
        {isLoggedInFB ? 'Share on Facebook' : 'Login & Share to Facebook'}
      </button>
      
      <button
        onClick={shareToInstagram}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#E4405F',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        <Instagram size={16} />
        Share on Instagram
      </button>
    </div>
  );
};

export default SocialShare;