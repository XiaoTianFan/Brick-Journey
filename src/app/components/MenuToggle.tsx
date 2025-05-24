'use client';

import React from 'react';

interface MenuToggleProps {
  onClick: () => void;
}

const MenuToggle: React.FC<MenuToggleProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-30 p-3 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-full shadow-lg hover:bg-amber-800 hover:bg-opacity-80 transition-all duration-200 hover:scale-105 border border-amber-700 border-opacity-30"
      aria-label="Open menu"
    >
      <svg
        className="w-6 h-6 text-gray-200 hover:text-amber-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
};

export default MenuToggle; 