'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SlideMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SlideMenu: React.FC<SlideMenuProps> = ({ isOpen, onToggle }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Hold Spiral', path: '/installations/holdspiral' },
    { name: 'Lens', path: '/installations/lens' },
    { name: 'Proliferation', path: '/installations/proliferation' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 bg-opacity-95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-wide">Brick Journey</h2>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-gray-300 hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={onToggle}
                className={`block w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  pathname === item.path
                    ? 'bg-amber-800 bg-opacity-40 text-amber-200 border-l-4 border-amber-700 shadow-lg'
                    : 'text-gray-200 hover:bg-white hover:bg-opacity-5 hover:text-white hover:border-l-4 hover:border-amber-700 hover:border-opacity-50'
                }`}
              >
                <span className="text-lg font-medium tracking-wide">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-sm text-gray-400 text-center tracking-wide">
              Interactive Art Installation
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlideMenu; 