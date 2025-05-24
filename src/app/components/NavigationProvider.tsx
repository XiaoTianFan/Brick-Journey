'use client';

import React, { useState } from 'react';
import SlideMenu from './SlideMenu';
import MenuToggle from './MenuToggle';

interface NavigationProviderProps {
  children: React.ReactNode;
}

const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <MenuToggle onClick={toggleMenu} />
      <SlideMenu isOpen={isMenuOpen} onToggle={toggleMenu} />
      {children}
    </>
  );
};

export default NavigationProvider; 