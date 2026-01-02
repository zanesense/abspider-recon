import React, { useState, useEffect } from 'react';
import LaunchAnnouncementPopup from './LaunchAnnouncementPopup';

const PostAuthAnnouncement: React.FC = () => {
  const [shouldShowAnnouncement, setShouldShowAnnouncement] = useState(false);

  useEffect(() => {
    // Check if both authentication and legal compliance are complete
    const checkConditions = () => {
      const hasAgreedToLegal = localStorage.getItem('abspider-legal-agreed');
      
      // If legal disclaimer has been accepted, show the announcement
      if (hasAgreedToLegal) {
        setShouldShowAnnouncement(true);
      }
    };

    // Check immediately
    checkConditions();

    // Also listen for storage changes in case legal disclaimer is accepted in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'abspider-legal-agreed' && e.newValue) {
        setShouldShowAnnouncement(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return <LaunchAnnouncementPopup shouldShow={shouldShowAnnouncement} />;
};

export default PostAuthAnnouncement;