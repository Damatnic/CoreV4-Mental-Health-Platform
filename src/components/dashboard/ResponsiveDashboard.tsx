import React, { useEffect, useState } from 'react';
import { ConsoleDashboard } from './console/ConsoleDashboard';
import { MobileEnhancedDashboard } from '../mobile/MobileEnhancedDashboard';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

export function ResponsiveDashboard() {
  const { deviceInfo, isMobileDevice, isSmallScreen } = useMobileFeatures();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use mobile dashboard for small screens and touch devices
  const shouldUseMobileDashboard = 
    windowWidth < 768 || 
    isMobileDevice || 
    isSmallScreen ||
    deviceInfo.hasTouch;

  return (
    <>
      {shouldUseMobileDashboard ? (
        <MobileEnhancedDashboard />
      ) : (
        <ConsoleDashboard />
      )}
    </>
  );
}

export default ResponsiveDashboard;